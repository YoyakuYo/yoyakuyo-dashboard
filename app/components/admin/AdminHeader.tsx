"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import NotificationBell from '@/app/components/NotificationBell';

export default function AdminHeader() {
  const t = useTranslations();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  if (!userId) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Yoyaku Yo
          </Link>
          <span className="text-gray-400">|</span>
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.dashboard')}</h2>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell userType="admin" userId={userId} />
        </div>
      </div>
    </header>
  );
}

