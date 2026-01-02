"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AssistantPage() {
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

  // MODIFIED: Replace blank screen with static capabilities list (now fully translated)
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('assistant.capabilitiesTitle')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('assistant.capabilitiesDescription')}
          </p>
        </div>

        {/* Capabilities List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12">
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityManageBookings')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityModifySchedule')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityUpdateShopHours')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityAnswerMessages')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityAutomatedResponses')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityAnalyzePerformance')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityRemindBookings')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityEditServices')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityAddStaff')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityMarkHolidays')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">{t('assistant.capabilityCheckAvailability')}</span>
            </li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            {t('assistant.capabilitiesCTA')}
          </p>
          <button
            onClick={() => router.push('/shops')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('nav.myShop')}
          </button>
        </div>
      </div>
    </div>
  );
}

