"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('settings.title')}</h1>

      <div className="space-y-6">
        {/* Account Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.accountInformation')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.email')}</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.userId')}</label>
              <p className="text-sm text-gray-600 font-mono">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.notifications')}</h2>
          <p className="text-gray-600 mb-4">
            {t('settings.manageNotifications')}
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">{t('settings.emailNotificationsNewBookings')}</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">{t('settings.emailNotificationsCustomerMessages')}</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">{t('settings.pushNotifications')}</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}

