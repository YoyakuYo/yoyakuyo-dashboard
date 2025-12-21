"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface Shop {
  id: string;
  name: string;
  opening_hours?: any;
}

// Opening Hours Editor Component
function OpeningHoursEditor({ 
  openingHours, 
  onChange 
}: { 
  openingHours: any; 
  onChange: (hours: any) => void;
}) {
  const t = useTranslations();
  const days = [
    { key: 'monday', label: t('myShop.monday') },
    { key: 'tuesday', label: t('myShop.tuesday') },
    { key: 'wednesday', label: t('myShop.wednesday') },
    { key: 'thursday', label: t('myShop.thursday') },
    { key: 'friday', label: t('myShop.friday') },
    { key: 'saturday', label: t('myShop.saturday') },
    { key: 'sunday', label: t('myShop.sunday') },
  ];

  const handleDayChange = (day: string, openTime: string, closeTime: string) => {
    const updated = { ...(openingHours || {}) };
    if (openTime && closeTime) {
      // Support both array format [open, close] and object format {start, end}
      if (Array.isArray(updated[day])) {
        updated[day] = [openTime, closeTime];
      } else {
        updated[day] = { start: openTime, end: closeTime };
      }
    } else {
      updated[day] = null;
    }
    onChange(updated);
  };

  const getDayHours = (day: string): [string, string] => {
    if (openingHours && openingHours[day]) {
      const dayHours = openingHours[day];
      if (Array.isArray(dayHours)) {
        return [dayHours[0] || '09:00', dayHours[1] || '18:00'];
      } else if (typeof dayHours === 'object' && dayHours !== null) {
        return [dayHours.start || dayHours.open || '09:00', dayHours.end || dayHours.close || '18:00'];
      }
    }
    return ['09:00', '18:00'];
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('myShop.openingHours')}
      </label>
      {days.map((day) => {
        const [openTime, closeTime] = getDayHours(day.key);
        const isClosed = !openingHours || !openingHours[day.key] || openingHours[day.key] === null;
        return (
          <div key={day.key} className="flex items-center gap-3">
            <div className="w-32 text-sm font-medium text-gray-700">
              {day.label}
            </div>
            {isClosed ? (
              <div className="flex-1 text-sm text-gray-500 italic">
                {t('myShop.closed')}
              </div>
            ) : (
              <>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => handleDayChange(day.key, e.target.value, closeTime)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => handleDayChange(day.key, openTime, e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </>
            )}
            <button
              type="button"
              onClick={() => handleDayChange(day.key, '', '')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isClosed
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              {isClosed ? t('myShop.markAsOpen') : t('myShop.closed')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function OwnerCalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [shop, setShop] = useState<Shop | null>(null);
  const [openingHours, setOpeningHours] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadShop();
    }
  }, [user, authLoading, router]);

  const loadShop = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          const shopData = data.shops[0];
          setShop(shopData);
          // Parse opening_hours if it's a string, otherwise use as-is
          let hours = shopData.opening_hours;
          if (typeof hours === 'string') {
            try {
              hours = JSON.parse(hours);
            } catch (e) {
              console.error('Error parsing opening_hours:', e);
              hours = {};
            }
          }
          setOpeningHours(hours || {});
        } else {
          setMessage({ type: 'error', text: t('myShop.noShop') });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || t('common.error') });
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      setMessage({ type: 'error', text: t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (hours: any) => {
    setOpeningHours(hours);
  };

  const handleSave = async () => {
    if (!shop?.id || !user?.id) return;

    try {
      setSaving(true);
      setMessage(null);

      // Convert array format to object format if needed (for API compatibility)
      const formattedHours: any = {};
      for (const [day, hours] of Object.entries(openingHours || {})) {
        if (hours === null) {
          formattedHours[day] = null;
        } else if (Array.isArray(hours)) {
          formattedHours[day] = { start: hours[0], end: hours[1] };
        } else {
          formattedHours[day] = hours;
        }
      }

      const res = await fetch(`${apiUrl}/shops/${shop.id}/opening-hours`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ opening_hours: formattedHours }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('myShop.openingHoursSaved') || 'Opening hours saved successfully!' });
        // Reload shop to get updated data
        await loadShop();
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || t('common.error') });
      }
    } catch (error) {
      console.error('Error saving opening hours:', error);
      setMessage({ type: 'error', text: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">{t('myShop.noShop')}</p>
          <button
            onClick={() => router.push('/owner/shop-profile')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('myShop.createShop')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('nav.calendar')}</h1>
        <p className="text-gray-600">{t('myShop.calendarManagement') || 'Manage your shop\'s opening hours and calendar'}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('myShop.openingHours')}</h2>
        
        <OpeningHoursEditor 
          openingHours={openingHours} 
          onChange={handleHoursChange}
        />

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.saving') : t('common.saveChanges')}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>{t('myShop.aiAssistantNote') || 'AI Assistant Note:'}</strong> {t('myShop.aiCanModifyHours') || 'Your AI assistant can also modify these opening hours when you ask it to change your schedule.'}
        </p>
      </div>
    </div>
  );
}
