"use client";

import React, { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface AvailabilityWindow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  source: 'manual' | 'booking' | 'template';
}

interface WeeklyHours {
  id: string;
  weekday: number; // 0-6, Sunday = 0
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface AvailabilityCalendarProps {
  shopId: string;
  userId: string;
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export function AvailabilityCalendar({ shopId, userId, onMessage }: AvailabilityCalendarProps) {
  const t = useTranslations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showWindowModal, setShowWindowModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [editingWindow, setEditingWindow] = useState<AvailabilityWindow | null>(null);
  const [saving, setSaving] = useState(false);

  // Load availability data
  useEffect(() => {
    loadAvailabilityData();
  }, [shopId, currentDate]);

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);

      // Load availability windows for current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const windowsRes = await fetch(`${apiUrl}/api/availability/${shopId}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`, {
        headers: { 'x-user-id': userId },
      });

      if (windowsRes.ok) {
        const windowsData = await windowsRes.json();
        setAvailabilityWindows(windowsData.windows || []);
      }

      // Load weekly template
      const weeklyRes = await fetch(`${apiUrl}/api/availability/${shopId}/weekly`, {
        headers: { 'x-user-id': userId },
      });

      if (weeklyRes.ok) {
        const weeklyData = await weeklyRes.json();
        setWeeklyHours(weeklyData.weekly || []);
      }
    } catch (error) {
      console.error('Error loading availability data:', error);
      onMessage('error', 'Failed to load availability data');
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
    return getWindowsForDate(date).some(window => window.status === 'available');
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

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingWindow(null);
    setShowWindowModal(true);
  };

  // Handle window creation/editing
  const handleWindowSave = async (windowData: Partial<AvailabilityWindow>) => {
    if (!selectedDate) return;

    try {
      setSaving(true);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const payload = {
        ...windowData,
        date: dateStr,
        status: windowData.status || 'available',
        source: 'manual',
      };

      let response;
      if (editingWindow) {
        // Update existing window
        response = await fetch(`${apiUrl}/api/availability/${shopId}/${editingWindow.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new window
        response = await fetch(`${apiUrl}/api/availability/${shopId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ windows: [payload] }),
        });
      }

      if (response.ok) {
        onMessage('success', editingWindow ? 'Availability window updated' : 'Availability window created');
        setShowWindowModal(false);
        await loadAvailabilityData();
      } else {
        const errorData = await response.json();
        onMessage('error', errorData.error || 'Failed to save availability window');
      }
    } catch (error) {
      console.error('Error saving availability window:', error);
      onMessage('error', 'Failed to save availability window');
    } finally {
      setSaving(false);
    }
  };

  // Handle window deletion
  const handleWindowDelete = async (windowId: string) => {
    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/availability/${shopId}/${windowId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      if (response.ok) {
        onMessage('success', 'Availability window deleted');
        setShowWindowModal(false);
        await loadAvailabilityData();
      } else {
        const errorData = await response.json();
        onMessage('error', errorData.error || 'Failed to delete availability window');
      }
    } catch (error) {
      console.error('Error deleting availability window:', error);
      onMessage('error', 'Failed to delete availability window');
    } finally {
      setSaving(false);
    }
  };

  // Save weekly template
  const handleWeeklySave = async (weeklyData: Partial<WeeklyHours>[]) => {
    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/availability/${shopId}/weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ weekly: weeklyData }),
      });

      if (response.ok) {
        onMessage('success', 'Weekly template saved successfully');
        setShowWeeklyModal(false);
        await loadAvailabilityData();
      } else {
        const errorData = await response.json();
        onMessage('error', errorData.error || 'Failed to save weekly template');
      }
    } catch (error) {
      console.error('Error saving weekly template:', error);
      onMessage('error', 'Failed to save weekly template');
    } finally {
      setSaving(false);
    }
  };

  // Generate availability from weekly template
  const handleGenerateFromTemplate = async (startDate: string, endDate: string) => {
    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/availability/${shopId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (response.ok) {
        onMessage('success', 'Availability generated from weekly template');
        await loadAvailabilityData();
      } else {
        const errorData = await response.json();
        onMessage('error', errorData.error || 'Failed to generate availability');
      }
    } catch (error) {
      console.error('Error generating availability:', error);
      onMessage('error', 'Failed to generate availability');
    } finally {
      setSaving(false);
    }
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
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

        <div className="flex gap-2">
          <button
            onClick={() => setShowWeeklyModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Edit Weekly Template
          </button>
          <button
            onClick={() => {
              const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              handleGenerateFromTemplate(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
              );
            }}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Generate from Template
          </button>
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
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const hasAvail = hasAvailability(date);
            const windows = getWindowsForDate(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
              >
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>

                {/* Availability indicators */}
                <div className="space-y-1">
                  {windows.slice(0, 2).map((window, idx) => (
                    <div
                      key={window.id}
                      className={`text-xs px-1 py-0.5 rounded text-white ${
                        window.status === 'available' ? 'bg-green-500' :
                        window.status === 'booked' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                    >
                      {window.start_time}-{window.end_time}
                    </div>
                  ))}
                  {windows.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{windows.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Availability Window Modal */}
      {showWindowModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingWindow ? 'Edit' : 'Add'} Availability for {selectedDate.toLocaleDateString()}
            </h3>

            <AvailabilityWindowForm
              window={editingWindow}
              onSave={handleWindowSave}
              onDelete={editingWindow ? handleWindowDelete : undefined}
              onCancel={() => setShowWindowModal(false)}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* Weekly Template Modal */}
      {showWeeklyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Weekly Template</h3>

            <WeeklyTemplateForm
              weeklyHours={weeklyHours}
              onSave={handleWeeklySave}
              onCancel={() => setShowWeeklyModal(false)}
              saving={saving}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Weekly Template Form Component
function WeeklyTemplateForm({
  weeklyHours,
  onSave,
  onCancel,
  saving
}: {
  weeklyHours: WeeklyHours[];
  onSave: (data: Partial<WeeklyHours>[]) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [hours, setHours] = useState<Partial<WeeklyHours>[]>(() => {
    // Initialize with existing data or defaults
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map((day, index) => {
      const existing = weeklyHours.find(h => h.weekday === index);
      return existing || {
        weekday: index,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: false,
      };
    });
  });

  const updateDay = (index: number, field: keyof WeeklyHours, value: any) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out closed days and prepare data for API
    const dataToSave = hours
      .filter(day => !day.is_closed)
      .map(day => ({
        weekday: day.weekday,
        open_time: day.open_time,
        close_time: day.close_time,
        is_closed: false,
      }));
    onSave(dataToSave);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Set your regular weekly schedule. This template can be used to generate availability windows for specific date ranges.
      </div>

      {hours.map((day, index) => (
        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
          <div className="w-24 font-medium">
            {dayNames[index]}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={day.is_closed || false}
              onChange={(e) => updateDay(index, 'is_closed', e.target.checked)}
              className="rounded"
            />
            Closed
          </label>

          {!day.is_closed && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm">Open:</label>
                <input
                  type="time"
                  value={day.open_time || '09:00'}
                  onChange={(e) => updateDay(index, 'open_time', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm">Close:</label>
                <input
                  type="time"
                  value={day.close_time || '18:00'}
                  onChange={(e) => updateDay(index, 'close_time', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </form>
  );
}

// Availability Window Form Component
function AvailabilityWindowForm({
  window,
  onSave,
  onDelete,
  onCancel,
  saving
}: {
  window: AvailabilityWindow | null;
  onSave: (data: Partial<AvailabilityWindow>) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [startTime, setStartTime] = useState(window?.start_time || '09:00');
  const [endTime, setEndTime] = useState(window?.end_time || '18:00');
  const [status, setStatus] = useState(window?.status || 'available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ start_time: startTime, end_time: endTime, status });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'available' | 'booked' | 'blocked')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="available">Available</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (window ? 'Update' : 'Create')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>

        {window && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(window.id)}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
