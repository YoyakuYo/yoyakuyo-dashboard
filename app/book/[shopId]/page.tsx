"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

interface DateStatus {
  date: string;
  status: 'available' | 'closed';
}

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params?.shopId as string;
  const t = useTranslations();

  const [availableDates, setAvailableDates] = useState<DateStatus[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Fetch available dates for the dropdown
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!shopId) return;
      setLoadingDates(true);
      try {
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]; // Next 2 months

        const url = `${apiUrl}/shops/${shopId}/availability/dates?startDate=${startDate}&endDate=${endDate}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: DateStatus[] = await res.json();
          setAvailableDates(data);
        } else {
          console.error("Failed to fetch available dates:", res.status);
          setAvailableDates([]);
        }
      } catch (error) {
        console.error("Error fetching available dates:", error);
        setAvailableDates([]);
      } finally {
        setLoadingDates(false);
      }
    };
    fetchAvailableDates();
  }, [shopId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('booking.bookAppointment')}</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseDate')}</h2>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={loadingDates}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {loadingDates
                  ? (t('common.loading') || 'Loading...')
                  : (t('booking.chooseDate') || 'Choose a date')}
              </option>
              {availableDates.map((dateStatus) => (
                <option
                  key={dateStatus.date}
                  value={dateStatus.date}
                  disabled={dateStatus.status === 'closed'}
                >
                  {new Date(dateStatus.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {dateStatus.status === 'closed' && ` - ${t("closed") || "CLOSED"}`}
                </option>
              ))}
            </select>
          </div>

          {selectedDate && (
            <div className="mb-6">
              <button
                onClick={() => router.push(`/book/${shopId}/timeslot?date=${selectedDate}`)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('booking.selectTime') || 'Select Time'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Placeholder */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('booking.shopInfo') || 'Shop Information'}
            </h3>
            <p className="text-gray-600">
              {t('booking.selectDateTime') || 'Please select a date and time to continue with your booking.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}