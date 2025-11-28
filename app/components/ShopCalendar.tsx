"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface Holiday {
  id: string;
  shop_id: string;
  holiday_date: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

interface ShopCalendarProps {
  shopId: string;
  userId: string;
}

export default function ShopCalendar({ shopId, userId }: ShopCalendarProps) {
  const t = useTranslations();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidayReason, setHolidayReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const res = await fetch(`${apiUrl}/holidays?shop_id=${shopId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHolidays(data || []);
      } else {
        console.error('Failed to fetch holidays');
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  useEffect(() => {
    if (shopId && userId) {
      fetchHolidays();
    }
  }, [shopId, userId]);

  // Mark date as holiday
  const handleAddHoliday = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const res = await fetch(`${apiUrl}/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          shop_id: shopId,
          holiday_date: dateStr,
          reason: holidayReason || null,
        }),
      });

      if (res.ok) {
        setSuccess(t('myShop.holidayAddedSuccess'));
        setHolidayReason('');
        setSelectedDate(null);
        await fetchHolidays();
      } else {
        const errorData = await res.json();
        setError(errorData.error || t('myShop.failedToAddHoliday'));
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      setError(t('myShop.failedToAddHoliday'));
    } finally {
      setLoading(false);
    }
  };

  // Remove holiday
  const handleRemoveHoliday = async (date: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${apiUrl}/holidays?shop_id=${shopId}&holiday_date=${date}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (res.ok) {
        setSuccess(t('myShop.holidayRemovedSuccess'));
        await fetchHolidays();
      } else {
        const errorData = await res.json();
        setError(errorData.error || t('myShop.failedToRemoveHoliday'));
      }
    } catch (error) {
      console.error('Error removing holiday:', error);
      setError(t('myShop.failedToRemoveHoliday'));
    } finally {
      setLoading(false);
    }
  };

  // Check if date is a holiday
  const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => h.holiday_date === dateStr);
  };

  // Get holiday reason for a date
  const getHolidayReason = (date: Date): string | null => {
    const dateStr = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.holiday_date === dateStr);
    return holiday?.reason || null;
  };

  // Tile content for calendar
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && isHoliday(date)) {
      return (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t"></div>
      );
    }
    return null;
  };

  // Tile className for styling holidays
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && isHoliday(date)) {
      return 'holiday-date';
    }
    return null;
  };

  const holidayDates = holidays.map(h => h.holiday_date);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('myShop.calendarManagement')}</h2>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <Calendar
            onChange={(value) => {
              if (value instanceof Date) {
                setSelectedDate(value);
                const reason = getHolidayReason(value);
                setHolidayReason(reason || '');
              }
            }}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="w-full border-0"
          />

          {/* Add/Remove Holiday Form */}
          {selectedDate && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {t('myShop.selectedDate')}: {selectedDate.toLocaleDateString()}
              </p>
              {isHoliday(selectedDate) ? (
                <div>
                  <p className="text-sm text-red-600 mb-2">
                    {t('myShop.dateMarkedAsClosed')}
                    {getHolidayReason(selectedDate) && `: ${getHolidayReason(selectedDate)}`}
                  </p>
                  <button
                    onClick={() => handleRemoveHoliday(selectedDate.toISOString().split('T')[0])}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? t('myShop.removingHoliday') : t('myShop.removeHoliday')}
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder={t('myShop.reasonOptional')}
                    value={holidayReason}
                    onChange={(e) => setHolidayReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <button
                    onClick={handleAddHoliday}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? t('myShop.addingHoliday') : t('myShop.markAsClosed')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Holidays List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('myShop.closedDates')}</h3>
          {holidays.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('myShop.noClosedDatesSet')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(holiday.holiday_date).toLocaleDateString()}
                    </p>
                    {holiday.reason && (
                      <p className="text-sm text-gray-600">{holiday.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(holiday.holiday_date)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {t('myShop.remove')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .holiday-date {
          background-color: #fee2e2 !important;
          color: #991b1b !important;
        }
        .holiday-date:hover {
          background-color: #fecaca !important;
        }
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          position: relative;
        }
        .react-calendar__tile--active {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        .react-calendar__tile--now {
          background-color: #dbeafe !important;
        }
      `}</style>
    </div>
  );
}

