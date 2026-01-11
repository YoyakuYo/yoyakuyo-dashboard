"use client";

import React, { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/apiClient';

interface AvailabilityWindow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  source: 'manual' | 'booking' | 'template';
}

interface CustomerBookingCalendarProps {
  shopId: string;
  serviceId?: string; // Optional - if provided, will show service duration
  serviceDurationMinutes?: number; // If provided, used to generate bookable slots from ranges
  onSlotSelect?: (slot: AvailabilityWindow) => void; // Callback when customer selects a slot
  selectedSlot?: AvailabilityWindow | null; // Currently selected slot
  onMessage?: (type: 'success' | 'error', text: string) => void;
}

interface Holiday {
  id: string;
  shop_id: string;
  holiday_date: string;
  reason: string | null;
}

export function CustomerBookingCalendar({
  shopId,
  serviceId,
  serviceDurationMinutes,
  onSlotSelect,
  selectedSlot,
  onMessage
}: CustomerBookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load availability data for the current month
  useEffect(() => {
    loadAvailabilityData();
  }, [shopId, currentDate]);

  const formatDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      console.log('[CustomerBookingCalendar] Loading availability for:', shopId);

      // Use same API as LINE booking page - get availability ranges for the month
      // We'll generate time slots dynamically based on service duration
      const slotsPromises = [];
      const current = new Date(startDate);

      // Get availability for each day in the month
      while (current <= endDate) {
        const dateStr = formatDateLocal(current);
        const dateResponse = fetch(`${apiUrl}/shops/${shopId}/availability?date=${dateStr}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        slotsPromises.push(dateResponse.then(async (res) => {
          if (res.ok) {
            const ranges = await res.json();
            return { date: dateStr, ranges: Array.isArray(ranges) ? ranges : [] };
          } else {
            console.warn(`[CustomerBookingCalendar] Failed to get availability for ${dateStr}:`, res.status);
            return { date: dateStr, ranges: [] };
          }
        }));
        current.setDate(current.getDate() + 1);
      }

      try {
        const dateResults = await Promise.all(slotsPromises);
        console.log('[CustomerBookingCalendar] Received date availability:', dateResults);

        // Generate availability windows from ranges based on service duration
        // and filter out slots that overlap with existing bookings
        const generatedWindows: AvailabilityWindow[] = [];

        dateResults.forEach(({ date, ranges }) => {
          if (ranges.length > 0) {
            // Generate time slots from availability ranges
            const serviceDuration = Math.max(1, serviceDurationMinutes || 60);
            const slots = generateTimeSlotsFromRanges(ranges, serviceDuration, date);

            // Filter out slots that are already booked or blocked
            // (The shop-availability API already filters this, so all returned ranges are available)
            generatedWindows.push(...slots);
          }
        });

        setAvailabilityWindows(generatedWindows);
      } catch (error) {
        console.error('[CustomerBookingCalendar] Error loading availability:', error);
        setError('Failed to load availability data');
      }

      // Load holidays
      const holidaysResponse = await fetch(`${apiUrl}/api/holidays?shop_id=${shopId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (holidaysResponse.ok) {
        const holidaysData = await holidaysResponse.json();
        console.log('[CustomerBookingCalendar] Received holidays:', holidaysData);
        setHolidays(holidaysData || []);
      } else {
        console.warn('[CustomerBookingCalendar] Could not load holidays:', holidaysResponse.status);
        // Don't set error for holidays - availability is more important
      }

    } catch (err) {
      console.error('[CustomerBookingCalendar] Network error:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Get availability windows for a specific date
  const getWindowsForDate = (date: Date): AvailabilityWindow[] => {
    const dateStr = formatDateLocal(date);
    return availabilityWindows.filter(window => window.date === dateStr);
  };

  // Check if date is a holiday
  const isHoliday = (date: Date): Holiday | null => {
    const dateStr = formatDateLocal(date);
    return holidays.find(holiday => holiday.holiday_date === dateStr) || null;
  };

  // Generate individual time slots from availability ranges
  const generateTimeSlotsFromRanges = (
    ranges: Array<{ start_time: string; end_time: string }>,
    serviceDuration: number,
    dateStr: string
  ): AvailabilityWindow[] => {
    const slots: AvailabilityWindow[] = [];

    ranges.forEach((range, rangeIndex) => {
      // Parse start and end times - handle both HH:MM and HH:MM:SS formats
      const startParts = range.start_time.split(':');
      const endParts = range.end_time.split(':');

      const startHour = parseInt(startParts[0], 10);
      const startMinute = parseInt(startParts[1] || '0', 10);
      const endHour = parseInt(endParts[0], 10);
      const endMinute = parseInt(endParts[1] || '0', 10);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Generate slots every serviceDuration minutes
      for (let currentMinutes = startMinutes; currentMinutes + serviceDuration <= endMinutes; currentMinutes += serviceDuration) {
        const startHours = Math.floor(currentMinutes / 60);
        const startMins = currentMinutes % 60;
        const startTimeString = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}:00`;

        // Calculate end time
        const endTotalMinutes = currentMinutes + serviceDuration;
        const endHours = Math.floor(endTotalMinutes / 60);
        const endMins = endTotalMinutes % 60;
        const endTimeString = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;

        slots.push({
          id: `${dateStr}-${rangeIndex}-${currentMinutes}`,
          date: dateStr,
          start_time: startTimeString,
          end_time: endTimeString,
          status: 'available',
          source: 'manual'
        });
      }
    });

    return slots;
  };

  // Check if date has availability
  const hasAvailability = (date: Date): boolean => {
    const windows = getWindowsForDate(date);
    return windows.length > 0; // Any windows means the date has some availability status
  };

  // Get the overall status for date background color
  const getDateStatus = (date: Date): 'available' | 'booked' | 'blocked' | 'holiday' | 'none' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Past dates should not be available
    if (dateOnly < today) return 'none';

    // Check for holiday first - holidays override all other availability
    if (isHoliday(date)) return 'holiday';

    const windows = getWindowsForDate(date);
    if (windows.length === 0) return 'none';

    // Priority: blocked > booked > available
    if (windows.some(w => w.status === 'blocked')) return 'blocked';
    if (windows.some(w => w.status === 'booked')) return 'booked';
    if (windows.some(w => w.status === 'available')) return 'available';

    return 'none';
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Handle date click - show available slots for that date
  const handleDateClick = (date: Date) => {
    // Don't allow clicking on holidays
    if (isHoliday(date)) {
      const holiday = isHoliday(date);
      onMessage?.('error', `This date is closed: ${holiday?.reason || 'Holiday'}`);
      return;
    }

    const windows = getWindowsForDate(date);
    const availableSlots = windows.filter(w => w.status === 'available');

    if (availableSlots.length === 0) {
      onMessage?.('error', 'No available time slots for this date');
      return;
    }

    if (availableSlots.length === 1) {
      onSlotSelect?.(availableSlots[0]);
      return;
    }

    setSelectedDate(date);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: AvailabilityWindow) => {
    onSlotSelect?.(slot);
    setSelectedDate(null); // Close the slot selection view
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-red-600 font-medium mb-2">Calendar Unavailable</p>
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <button
          onClick={() => loadAvailabilityData()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (availabilityWindows.length === 0) {
    return (
      <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-4xl mb-2">📅</div>
        <p className="text-blue-600 font-medium mb-2">No Availability Set</p>
        <p className="text-sm text-blue-500">
          This shop hasn't scheduled any available times yet.
          <br />
          Please contact them directly to arrange booking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ‹
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {getCalendarDays().map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStatus = getDateStatus(date);
            const windows = getWindowsForDate(date);
            const availableSlots = windows.filter(w => w.status === 'available');
            const bookedSlots = windows.filter(w => w.status === 'booked');
            const blockedSlots = windows.filter(w => w.status === 'blocked');

            // Get background color based on date status
            const getBackgroundColor = () => {
              if (!isCurrentMonth) return 'bg-gray-50';
              if (isToday) return 'bg-blue-50';

              switch (dateStatus) {
                case 'holiday': return 'bg-orange-200 hover:bg-orange-300';
                case 'blocked': return 'bg-red-200 hover:bg-red-300';
                case 'booked': return 'bg-red-50 hover:bg-red-100';
                case 'available': return 'bg-green-50 hover:bg-green-100';
                default: return 'hover:bg-gray-50';
              }
            };

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors ${getBackgroundColor()}`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
              >
                <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? 'text-gray-400' : isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>

                {isCurrentMonth && windows.length > 0 && (
                  <div className="space-y-1">
                    {/* Show status summary for the date */}
                    <div className={`text-xs px-1 py-0.5 rounded text-white font-medium ${
                      dateStatus === 'blocked' ? 'bg-gray-500' :
                      dateStatus === 'booked' ? 'bg-red-500' :
                      dateStatus === 'available' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {dateStatus === 'holiday' ? 'HOLIDAY' :
                       dateStatus === 'blocked' ? 'CLOSED' :
                       dateStatus === 'booked' ? `${bookedSlots.length} Booked` :
                       dateStatus === 'available' ? `${availableSlots.length} Available` : 'NO SLOTS'}
                    </div>

                    {/* Show up to 2 time slots */}
                    {windows.slice(0, 2).map((window, idx) => (
                      <div
                        key={window.id}
                        className={`text-xs px-1 py-0.5 rounded text-white ${
                          window.status === 'available' ? 'bg-green-600' :
                          window.status === 'booked' ? 'bg-red-600' : 'bg-gray-600'
                        }`}
                      >
                        {window.start_time.substring(0, 5)}-{window.end_time.substring(0, 5)}
                      </div>
                    ))}

                    {/* Show "more" indicator if there are additional slots */}
                    {windows.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{windows.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Selection Modal */}
      {selectedDate && (
        <SlotSelectionModal
          date={selectedDate}
          windows={getWindowsForDate(selectedDate)}
          serviceId={serviceId}
          selectedSlot={selectedSlot || null}
          onSlotSelect={handleSlotSelect}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

// Slot Selection Modal Component
interface SlotSelectionModalProps {
  date: Date;
  windows: AvailabilityWindow[];
  serviceId?: string;
  selectedSlot: AvailabilityWindow | null;
  onSlotSelect: (slot: AvailabilityWindow) => void;
  onClose: () => void;
}

function SlotSelectionModal({
  date,
  windows,
  serviceId,
  selectedSlot,
  onSlotSelect,
  onClose
}: SlotSelectionModalProps) {
  const availableSlots = windows.filter(w => w.status === 'available');
  const bookedSlots = windows.filter(w => w.status === 'booked');
  const blockedSlots = windows.filter(w => w.status === 'blocked');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Available Times for {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⏰</div>
              <p className="text-gray-600">No available time slots for this date.</p>
              <p className="text-sm text-gray-500 mt-1">Please select a different date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Click on an available time slot to book your appointment:
              </p>

              {/* Available Slots */}
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">Available Times</h4>
                <div className="grid gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => onSlotSelect(slot)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
                        selectedSlot?.id === slot.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-green-500 bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Available</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Booked Slots (for reference) */}
              {bookedSlots.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-700">Booked Times</h4>
                  <div className="grid gap-2">
                    {bookedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 border-2 border-red-200 bg-red-50 rounded-lg opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-700">
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-red-600">Booked</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocked Slots (for reference) */}
              {blockedSlots.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Unavailable Times</h4>
                  <div className="grid gap-2">
                    {blockedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 border-2 border-gray-200 bg-gray-50 rounded-lg opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-600">Unavailable</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
