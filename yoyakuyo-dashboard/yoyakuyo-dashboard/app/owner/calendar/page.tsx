"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';
import { AvailabilityCalendar } from '../../components/AvailabilityCalendar';
import OwnerGuard from '@/app/components/OwnerGuard';

interface Shop {
  id: string;
  name: string;
}

export default function OwnerCalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!shop) {
  return (
    <div>
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

  if (!shop?.id) {
    return null; // Component will render loading or error state
  }

  return (
    <OwnerGuard>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('nav.calendar')}</h1>
          <p className="text-gray-600">{t('myShop.calendarManagement') || 'Manage your shop\'s availability and calendar'}</p>
        </div>

        <AvailabilityCalendar
          shopId={shop.id}
          userId={user?.id || ''}
          onMessage={(type, text) => setMessage({ type, text })}
        />

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </OwnerGuard>
  );
}
