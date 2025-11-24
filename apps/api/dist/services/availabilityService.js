"use strict";
// apps/api/src/services/availabilityService.ts
// Service for checking shop availability and finding available time slots
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTimeSlotAvailability = checkTimeSlotAvailability;
exports.findAvailableSlots = findAvailableSlots;
const supabase_1 = require("../lib/supabase");
const calendarService_1 = require("./calendarService");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Checks if a specific time slot is available for booking
 */
function checkTimeSlotAvailability(shopId, startTime, endTime, staffId) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const isHoliday = yield (0, calendarService_1.isShopHoliday)(shopId, startDate);
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
            const { data: staff, error: staffError } = yield staffQuery;
            if (staffError || !staff || staff.length === 0) {
                return {
                    isAvailable: false,
                    reason: 'No staff available for this shop',
                };
            }
            const staffIds = staff.map(s => s.id);
            // Check availability schedule for the day
            const { data: availability, error: availError } = yield dbClient
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
                const isWithinSchedule = availability.some((avail) => {
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
            const { data: conflictingBookings, error: bookingError } = yield dbClient
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
                    const staffConflicts = conflictingBookings.filter((b) => b.staff_id === staffId);
                    if (staffConflicts.length > 0) {
                        return {
                            isAvailable: false,
                            reason: 'Time slot is already booked for this staff member',
                        };
                    }
                }
                else {
                    // If no staff specified, check if ALL staff are booked
                    const allStaffBooked = staffIds.every((sid) => {
                        return conflictingBookings.some((b) => b.staff_id === sid);
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
        }
        catch (error) {
            console.error('Error in checkTimeSlotAvailability:', error);
            return {
                isAvailable: false,
                reason: error.message || 'Error checking availability',
            };
        }
    });
}
/**
 * Finds available time slots for a given date and service duration
 */
function findAvailableSlots(shopId_1, date_1) {
    return __awaiter(this, arguments, void 0, function* (shopId, date, // YYYY-MM-DD
    durationMinutes = 60, staffId) {
        try {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const dayOfWeek = targetDate.getDay();
            // Check if date is a holiday - if so, return no available slots
            const isHoliday = yield (0, calendarService_1.isShopHoliday)(shopId, targetDate);
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
            const { data: staff, error: staffError } = yield staffQuery;
            if (staffError || !staff || staff.length === 0) {
                return [];
            }
            const staffIds = staff.map(s => s.id);
            // Get availability schedule for the day
            const { data: availability, error: availError } = yield dbClient
                .from('availability')
                .select('*')
                .in('staff_id', staffIds)
                .eq('day_of_week', dayOfWeek);
            if (availError) {
                console.error('Error fetching availability:', availError);
            }
            // If no schedule, generate default slots (9 AM - 6 PM)
            let timeSlots = [];
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
            }
            else {
                // Use actual availability schedule
                for (const avail of availability) {
                    const staffMember = staff.find(s => s.id === avail.staff_id);
                    if (!staffMember)
                        continue;
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
            const { data: bookings, error: bookingError } = yield dbClient
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
            const availableSlots = [];
            for (const slot of timeSlots) {
                const slotStart = new Date(slot.start);
                const slotEnd = new Date(slot.end);
                // Check if slot conflicts with any booking
                const hasConflict = bookings === null || bookings === void 0 ? void 0 : bookings.some((booking) => {
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
                    return ((slotStart >= bookingStart && slotStart < bookingEnd) ||
                        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                        (slotStart <= bookingStart && slotEnd >= bookingEnd));
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
            availableSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            return availableSlots;
        }
        catch (error) {
            console.error('Error in findAvailableSlots:', error);
            return [];
        }
    });
}
