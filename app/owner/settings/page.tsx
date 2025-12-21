// app/owner/settings/page.tsx
// Owner settings page

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import PushNotificationButton from "@/app/components/PushNotificationButton";
import { useTranslations } from 'next-intl';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
}

export default function OwnerSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadUserProfile();
    }
  }, [user, authLoading, router]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user || { id: user.id, email: user.email || '' });
      } else {
        // Fallback to auth user data
        setUserProfile({ id: user.id, email: user.email || '' });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to auth user data
      setUserProfile({ id: user.id, email: user.email || '' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">{t('settings.accountInformation')}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.email')}
              </label>
              <p className="text-gray-900">{userProfile?.email || user?.email || t('dashboard.na')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.fullName')}
              </label>
              <p className="text-gray-900">{userProfile?.full_name || t('dashboard.na')}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">{t('settings.preferences')}</h2>
          <p className="text-gray-600">{t('settings.preferencesComingSoon')}</p>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">{t('settings.notifications')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.pushNotifications')}
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {t('settings.pushNotificationsDesc')}
              </p>
              <PushNotificationButton userType="owner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

