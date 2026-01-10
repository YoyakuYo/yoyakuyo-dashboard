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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingWindow, setEditingWindow] = useState<AvailabilityWindow | null>(null);
  const [windowToDelete, setWindowToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [unavailableMode, setUnavailableMode] = useState(false);

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
    const windows = getWindowsForDate(date);
    return windows.length > 0; // Any windows means the date has some availability status
  };

  // Check if date is unavailable (blocked)
  const isUnavailable = (date: Date): boolean => {
    return getWindowsForDate(date).some(window => window.status === 'blocked');
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

  // Handle date click - show slot management modal
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingWindow(null);

    if (unavailableMode) {
      // Mark date as unavailable or clear unavailability
      handleMarkUnavailable(date);
    } else {
      // Always show slot management modal for the selected date
      setShowWindowModal(true);
    }
  };

  // Clear unavailability for a date (remove blocked windows)
  const handleClearUnavailability = async (date: Date) => {
    try {
      setSaving(true);
      const existingWindows = getWindowsForDate(date);

      // Delete all blocked windows for this date
      for (const window of existingWindows) {
        if (window.status === 'blocked') {
          await fetch(`${apiUrl}/api/availability/${shopId}/${window.id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId },
          });
        }
      }

      onMessage('success', 'Date availability cleared - you can now add available time slots');
      await loadAvailabilityData();
    } catch (error) {
      console.error('Error clearing unavailability:', error);
      onMessage('error', 'Failed to clear date availability');
    } finally {
      setSaving(false);
    }
  };

  // Mark date as unavailable (blocked)
  const handleMarkUnavailable = async (date: Date) => {
    try {
      setSaving(true);

      const existingWindows = getWindowsForDate(date);
      const isCurrentlyUnavailable = isUnavailable(date);

      if (isCurrentlyUnavailable) {
        // Already unavailable - maybe show message
        onMessage('success', 'Date is already marked as unavailable');
        return;
      } else {
        // Mark as unavailable
        const dateStr = date.toISOString().split('T')[0];
        const payload = {
          date: dateStr,
          start_time: '00:00',
          end_time: '23:59',
          status: 'blocked',
          source: 'manual',
        };

        // Check if date already has availability windows
        if (existingWindows.length > 0) {
          // If there are existing windows, ask for confirmation or just block the entire day
          if (!confirm(`This date already has availability windows. Marking as unavailable will block the entire day. Continue?`)) {
            return;
          }
          // Delete existing windows first
          for (const window of existingWindows) {
            await fetch(`${apiUrl}/api/availability/${shopId}/${window.id}`, {
              method: 'DELETE',
              headers: { 'x-user-id': userId },
            });
          }
        }

        // Create blocked window for entire day
        const response = await fetch(`${apiUrl}/api/availability/${shopId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ windows: [payload] }),
        });

        if (response.ok) {
          onMessage('success', 'Date marked as unavailable');
        } else {
          const errorData = await response.json();
          onMessage('error', errorData.error || 'Failed to mark date as unavailable');
          return;
        }
      }

      await loadAvailabilityData();
    } catch (error) {
      console.error('Error updating date availability:', error);
      onMessage('error', 'Failed to update date availability');
    } finally {
      setSaving(false);
    }
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
        setEditingWindow(null); // Clear editing state
        await loadAvailabilityData();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to save availability window';
        // Provide more helpful error message for overlap errors
        if (errorMessage.includes('overlaps with existing slot')) {
          onMessage('error', `This time slot overlaps with an existing slot. Please choose a different time or delete the conflicting slot first.`);
        } else {
          onMessage('error', errorMessage);
        }
      }
    } catch (error) {
      console.error('Error saving availability window:', error);
      onMessage('error', 'Failed to save availability window');
    } finally {
      setSaving(false);
    }
  };

  // Handle window deletion (show modal)
  const handleWindowDelete = (windowId: string) => {
    setWindowToDelete(windowId);
    setShowDeleteModal(true);
  };

  // Confirm and execute window deletion
  const confirmDeleteWindow = async () => {
    if (!windowToDelete) return;

    try {
      setSaving(true);
      const response = await fetch(`${apiUrl}/api/availability/${shopId}/${windowToDelete}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      if (response.ok) {
        onMessage('success', 'Availability window deleted');
        setShowWindowModal(false);
        setShowDeleteModal(false);
        setWindowToDelete(null);
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
            onClick={() => setUnavailableMode(!unavailableMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              unavailableMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={unavailableMode ? 'Click dates to mark as unavailable or clear existing unavailability' : 'Click dates to add specific available time slots'}
          >
            {unavailableMode ? '🚫 Manage Unavailability' : '✓ Add Available Times'}
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
            const unavailable = isUnavailable(date);
            const windows = getWindowsForDate(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b cursor-pointer ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''} ${
                  unavailable ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                } ${
                  unavailableMode && isCurrentMonth ? 'ring-2 ring-red-300 ring-opacity-50' : ''
                }`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
              >
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>

                {/* Availability indicators */}
                <div className="space-y-1">
                  {unavailable ? (
                    <div className="text-xs px-1 py-0.5 rounded bg-red-500 text-white font-medium">
                      UNAVAILABLE
                    </div>
                  ) : (
                    <>
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
                      {windows.length === 0 && (
                        <div className="text-xs text-gray-400 italic">
                          No availability
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Management Modal - Shows all slots for selected date */}
      {showWindowModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage Time Slots for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>

            <SlotManagementView
              date={selectedDate}
              slots={getWindowsForDate(selectedDate)}
              onAddSlot={(slotData) => {
                const dateStr = selectedDate.toISOString().split('T')[0];
                handleWindowSave({ ...slotData, date: dateStr });
              }}
              onEditSlot={(slotId, slotData) => {
                const slot = availabilityWindows.find(w => w.id === slotId);
                if (slot) {
                  // Set editing window first, then save (with the slot ID for update)
                  setEditingWindow(slot);
                  // Use setTimeout to ensure state is updated before save
                  setTimeout(() => {
                    handleWindowSave(slotData);
                  }, 0);
                }
              }}
              onDeleteSlot={handleWindowDelete}
              onCancel={() => {
                setShowWindowModal(false);
                setEditingWindow(null);
              }}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Availability Window</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete this availability window? This will permanently remove the time slot and cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWindowToDelete(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWindow}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Deleting...' : 'Delete Window'}
              </button>
            </div>
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

// Slot Management View Component - Shows timeline of slots for a date
function SlotManagementView({
  date,
  slots,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onCancel,
  saving
}: {
  date: Date;
  slots: AvailabilityWindow[];
  onAddSlot: (data: Partial<AvailabilityWindow>) => void;
  onEditSlot: (slotId: string, data: Partial<AvailabilityWindow>) => void;
  onDeleteSlot: (slotId: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<{ start_time: string; end_time: string; status: 'available' | 'blocked' }>({ 
    start_time: '09:00', 
    end_time: '10:00', 
    status: 'available' 
  });

  // Sort slots by start time
  const sortedSlots = [...slots].sort((a, b) => {
    const aTime = a.start_time;
    const bTime = b.start_time;
    return aTime.localeCompare(bTime);
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSlot(newSlot);
    setNewSlot({ start_time: '09:00', end_time: '10:00', status: 'available' });
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-500 text-green-800';
      case 'booked': return 'bg-red-100 border-red-500 text-red-800';
      case 'blocked': return 'bg-gray-100 border-gray-500 text-gray-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Slots Timeline */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Time Slots</h4>
        {sortedSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p>No time slots for this date</p>
            <p className="text-sm mt-1">Click "Add Slot" to create availability</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSlots.map((slot) => (
              <div
                key={slot.id}
                className={`p-4 border-2 rounded-lg ${getStatusColor(slot.status)} flex items-center justify-between`}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {slot.start_time} - {slot.end_time}
                  </div>
                  <div className="text-sm opacity-75">
                    {getStatusLabel(slot.status)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {slot.status !== 'booked' && (
                    <>
                      <button
                        onClick={() => setEditingSlotId(slot.id)}
                        disabled={saving}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteSlot(slot.id)}
                        disabled={saving}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {slot.status === 'booked' && (
                    <span className="px-3 py-1 bg-gray-400 text-white rounded text-sm">
                      Booked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Slot Form */}
      {showAddForm && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h5 className="font-medium mb-3">Add New Slot</h5>
          <form onSubmit={handleAddSlot} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={newSlot.status}
                onChange={(e) => setNewSlot({ ...newSlot, status: e.target.value as 'available' | 'blocked' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="available">Available</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Slot
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewSlot({ start_time: '09:00', end_time: '10:00', status: 'available' });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Slot Form */}
      {editingSlotId && (() => {
        const slot = slots.find(s => s.id === editingSlotId);
        if (!slot) return null;
        
        return (
          <SlotEditForm
            slot={slot}
            onSave={(data) => {
              onEditSlot(editingSlotId, data);
              setEditingSlotId(null);
            }}
            onCancel={() => setEditingSlotId(null)}
            saving={saving}
          />
        );
      })()}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={saving || editingSlotId !== null}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {showAddForm ? 'Cancel Add' : '+ Add Slot'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Slot Edit Form Component
function SlotEditForm({
  slot,
  onSave,
  onCancel,
  saving
}: {
  slot: AvailabilityWindow;
  onSave: (data: Partial<AvailabilityWindow>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [startTime, setStartTime] = useState(slot.start_time);
  const [endTime, setEndTime] = useState(slot.end_time);
  const [status, setStatus] = useState(slot.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ start_time: startTime, end_time: endTime, status });
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
      <h5 className="font-medium mb-3">Edit Slot</h5>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'available' | 'booked' | 'blocked')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={status === 'booked'}
          >
            <option value="available">Available</option>
            <option value="blocked">Blocked</option>
            {status === 'booked' && <option value="booked">Booked</option>}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Availability Window Form Component (kept for backward compatibility)
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
