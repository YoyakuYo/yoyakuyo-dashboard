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
  onSlotSelect?: (slot: AvailabilityWindow) => void; // Callback when customer selects a slot
  selectedSlot?: AvailabilityWindow | null; // Currently selected slot
  onMessage?: (type: 'success' | 'error', text: string) => void;
}

export function CustomerBookingCalendar({
  shopId,
  serviceId,
  onSlotSelect,
  selectedSlot,
  onMessage
}: CustomerBookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load availability data for the current month
  useEffect(() => {
    loadAvailabilityData();
  }, [shopId, currentDate]);

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);

      // Load availability windows for current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      console.log('[CustomerBookingCalendar] Loading availability for shop:', shopId, 'from', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

      const windowsRes = await fetch(`${apiUrl}/api/availability/${shopId}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`);

      console.log('[CustomerBookingCalendar] API response status:', windowsRes.status);

      if (windowsRes.ok) {
        const windowsData = await windowsRes.json();
        console.log('[CustomerBookingCalendar] Received availability data:', windowsData);
        setAvailabilityWindows(windowsData.windows || []);
      } else {
        const errorText = await windowsRes.text();
        console.error('Failed to load availability data:', windowsRes.status, errorText);
        onMessage?.('error', 'Failed to load availability data');
      }
    } catch (error) {
      console.error('Error loading availability data:', error);
      onMessage?.('error', 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  // Get availability windows for a specific date
  const getWindowsForDate = (date: Date): AvailabilityWindow[] => {
    const dateStr = date.toISOString().split('T')[0];
    return availabilityWindows.filter(window => window.date === dateStr);
  };

  // Check if date has availability
  const hasAvailability = (date: Date): boolean => {
    const windows = getWindowsForDate(date);
    return windows.length > 0; // Any windows means the date has some availability status
  };

  // Get the overall status for date background color
  const getDateStatus = (date: Date): 'available' | 'booked' | 'blocked' | 'none' => {
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
    const windows = getWindowsForDate(date);
    const availableSlots = windows.filter(w => w.status === 'available');

    if (availableSlots.length === 0) {
      // No available slots for this date
      onMessage?.('error', 'No available time slots for this date');
      return;
    }

    // If there's only one available slot and no service selected, auto-select it
    if (availableSlots.length === 1 && !serviceId) {
      onSlotSelect?.(availableSlots[0]);
      return;
    }

    // Show the date details (will show slot selection)
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
                      {dateStatus === 'blocked' ? 'CLOSED' :
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
