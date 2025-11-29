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

  // MODIFIED: Replace blank screen with static capabilities list
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Assistant Capabilities
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your AI Assistant is available throughout the dashboard via the chat bubble in the bottom-right corner. 
            It can help you manage your shop efficiently with the following capabilities:
          </p>
        </div>

        {/* Capabilities List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12">
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Manage bookings - View, confirm, reject, or cancel customer bookings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Modify schedule - Update your shop's calendar and availability</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Update shop hours - Change opening and closing times</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Answer customer messages - Respond to customer inquiries automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Create automated responses - Set up automatic replies for common questions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Analyze shop performance - Get insights on bookings, revenue, and trends</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Remind the owner about upcoming bookings - Get notifications for pending bookings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Edit services and prices - Update your service offerings and pricing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Add new staff - Manage your team members and their schedules</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Mark holidays and closed dates - Set days when your shop is closed</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl mt-1">•</span>
              <span className="text-lg">Check availability - View real-time booking availability</span>
            </li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Click the AI Assistant chat bubble in the bottom-right corner to get started!
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

