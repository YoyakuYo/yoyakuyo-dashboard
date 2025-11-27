// apps/api/src/services/availabilityService.ts
// Service for checking shop availability and finding available time slots

import { supabaseAdmin, supabase } from '../lib/supabase';
import { isShopHoliday } from './calendarService';

const dbClient = supabaseAdmin || supabase;

export interface AvailableSlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  staffId?: string | null;
  staffName?: string | null;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  availableSlots?: AvailableSlot[];
  reason?: string;
}

/**
 * Checks if a specific time slot is available for booking
 */
export async function checkTimeSlotAvailability(
  shopId: string,
  startTime: string,
  endTime: string,
  staffId?: string | null
): Promise<AvailabilityCheckResult> {
  try {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const dayOfWeek = startDate.getDay();

    // Check if time is in the past
    if (startDate <= new Date()) {
      return {
        isAvailable: false,
        reason: 'Time slot is in the past',
      };
    }

    // Check if date is a holiday
    const isHoliday = await isShopHoliday(shopId, startDate);
    if (isHoliday) {
      return {
        isAvailable: false,
        reason: 'Shop is closed on this date (holiday)',
      };
    }

    // Get staff members for the shop
    let staffQuery = dbClient
      .from('staff')
      .select('id, first_name, last_name')
      .eq('shop_id', shopId);

    if (staffId) {
      staffQuery = staffQuery.eq('id', staffId);
    }

    const { data: staff, error: staffError } = await staffQuery;

    if (staffError || !staff || staff.length === 0) {
      return {
        isAvailable: false,
        reason: 'No staff available for this shop',
      };
    }

    const staffIds = staff.map(s => s.id);

    // Check availability schedule for the day
    const { data: availability, error: availError } = await dbClient
      .from('availability')
      .select('*')
      .in('staff_id', staffIds)
      .eq('day_of_week', dayOfWeek);

    if (availError) {
      console.error('Error fetching availability:', availError);
    }

    // If no availability schedule, allow booking (shop might be flexible)
    const hasSchedule = availability && availability.length > 0;

    if (hasSchedule) {
      // Check if requested time falls within any availability window
      const startTimeStr = startDate.toTimeString().substring(0, 5); // HH:MM
      const endTimeStr = endDate.toTimeString().substring(0, 5);

      const isWithinSchedule = availability.some((avail: any) => {
        return startTimeStr >= avail.start_time && endTimeStr <= avail.end_time;
      });

      if (!isWithinSchedule) {
        return {
          isAvailable: false,
          reason: 'Time slot is outside shop operating hours',
        };
      }
    }

    // Check for conflicting bookings
    const { data: conflictingBookings, error: bookingError } = await dbClient
      .from('bookings')
      .select('id, start_time, end_time, staff_id, status')
      .eq('shop_id', shopId)
      .in('status', ['pending', 'confirmed'])
      .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

    if (bookingError) {
      console.error('Error checking bookings:', bookingError);
      // If we can't check, assume available (fail open)
      return { isAvailable: true };
    }

    // Check if any booking conflicts
    if (conflictingBookings && conflictingBookings.length > 0) {
      // If staffId specified, only check conflicts for that staff
      if (staffId) {
        const staffConflicts = conflictingBookings.filter(
          (b: any) => b.staff_id === staffId
        );
        if (staffConflicts.length > 0) {
          return {
            isAvailable: false,
            reason: 'Time slot is already booked for this staff member',
          };
        }
      } else {
        // If no staff specified, check if ALL staff are booked
        const allStaffBooked = staffIds.every((sid) => {
          return conflictingBookings.some((b: any) => b.staff_id === sid);
        });

        if (allStaffBooked) {
          return {
            isAvailable: false,
            reason: 'All staff members are booked at this time',
          };
        }
      }
    }

    return { isAvailable: true };
  } catch (error: any) {
    console.error('Error in checkTimeSlotAvailability:', error);
    return {
      isAvailable: false,
      reason: error.message || 'Error checking availability',
    };
  }
}

/**
 * Finds available time slots for a given date and service duration
 */
export async function findAvailableSlots(
  shopId: string,
  date: string, // YYYY-MM-DD
  durationMinutes: number = 60,
  staffId?: string | null
): Promise<AvailableSlot[]> {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dayOfWeek = targetDate.getDay();

    // Check if date is a holiday - if so, return no available slots
    const isHoliday = await isShopHoliday(shopId, targetDate);
    if (isHoliday) {
      return [];
    }

    // Get staff members
    let staffQuery = dbClient
      .from('staff')
      .select('id, first_name, last_name')
      .eq('shop_id', shopId);

    if (staffId) {
      staffQuery = staffQuery.eq('id', staffId);
    }

    const { data: staff, error: staffError } = await staffQuery;

    if (staffError || !staff || staff.length === 0) {
      return [];
    }

    const staffIds = staff.map(s => s.id);

    // Get availability schedule for the day
    const { data: availability, error: availError } = await dbClient
      .from('availability')
      .select('*')
      .in('staff_id', staffIds)
      .eq('day_of_week', dayOfWeek);

    if (availError) {
      console.error('Error fetching availability:', availError);
    }

    // If no schedule, generate default slots (9 AM - 6 PM)
    let timeSlots: Array<{ start: string; end: string; staffId: string; staffName: string }> = [];

    if (!availability || availability.length === 0) {
      // Default: 9 AM to 6 PM, 1-hour slots
      for (const s of staff) {
        for (let hour = 9; hour < 18; hour++) {
          const slotStart = new Date(targetDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);

          if (slotEnd.getHours() <= 18) {
            timeSlots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              staffId: s.id,
              staffName: `${s.first_name} ${s.last_name}`.trim(),
            });
          }
        }
      }
    } else {
      // Use actual availability schedule
      for (const avail of availability) {
        const staffMember = staff.find(s => s.id === avail.staff_id);
        if (!staffMember) continue;

        const [startHour, startMin] = avail.start_time.split(':').map(Number);
        const [endHour, endMin] = avail.end_time.split(':').map(Number);

        const availStart = new Date(targetDate);
        availStart.setHours(startHour, startMin, 0, 0);
        const availEnd = new Date(targetDate);
        availEnd.setHours(endHour, endMin, 0, 0);

        // Generate slots within availability window
        let currentSlot = new Date(availStart);
        while (currentSlot < availEnd) {
          const slotEnd = new Date(currentSlot);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          if (slotEnd <= availEnd) {
            timeSlots.push({
              start: currentSlot.toISOString(),
              end: slotEnd.toISOString(),
              staffId: avail.staff_id,
              staffName: `${staffMember.first_name} ${staffMember.last_name}`.trim(),
            });
          }

          // Move to next slot (30-minute intervals)
          currentSlot.setMinutes(currentSlot.getMinutes() + 30);
        }
      }
    }

    // Get existing bookings for the day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingError } = await dbClient
      .from('bookings')
      .select('start_time, end_time, staff_id, status')
      .eq('shop_id', shopId)
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    if (bookingError) {
      console.error('Error fetching bookings:', bookingError);
    }

    // Filter out conflicting slots
    const availableSlots: AvailableSlot[] = [];

    for (const slot of timeSlots) {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      // Check if slot conflicts with any booking
      const hasConflict = bookings?.some((booking: any) => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);

        // If staff specified, only check conflicts for that staff
        if (staffId && booking.staff_id !== staffId) {
          return false;
        }
        if (slot.staffId && booking.staff_id !== slot.staffId) {
          return false;
        }

        // Check time overlap
        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: slot.start,
          endTime: slot.end,
          staffId: slot.staffId,
          staffName: slot.staffName,
        });
      }
    }

    // Sort by time
    availableSlots.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return availableSlots;
  } catch (error: any) {
    console.error('Error in findAvailableSlots:', error);
    return [];
  }
}

