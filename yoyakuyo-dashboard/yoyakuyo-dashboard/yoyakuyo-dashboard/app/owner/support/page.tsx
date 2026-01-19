"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import SupportChat from '../../components/SupportChat';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function OwnerSupportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [shopId, setShopId] = useState<string | null>(null);

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
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Shop data:', data); // Debug log
        if (data.shops && data.shops.length > 0) {
          setShopId(data.shops[0].id);
        } else {
          console.warn('No shops found for user:', user.id);
        }
      } else {
        const errorText = await res.text();
        console.error('Failed to load shop:', res.status, errorText);
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/owner/shop-profile" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← {t('common.back')} {t('nav.dashboard')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{t('support.title')}</h1>
        <p className="text-gray-600 mt-1">{t('support.subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
        <p className="text-gray-600 mb-4">{t('support.unavailable')}</p>
        <Link
          href="/owner/shop-profile"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {t('common.back')} {t('nav.dashboard')} →
        </Link>
      </div>
    </div>
  );
}

