// apps/dashboard/app/services/page.tsx
// Services Page

"use client";

import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

function ServicesPageContent() {
  let t: ReturnType<typeof useTranslations>;
  let tService: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tService = useTranslations('service');
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tService = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {tService('pageTitle') || 'Services'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {tService('pageSubtitle') || 'Discover services offered by Yoyaku Yo.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* AI Chat Booking */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Chat Booking</h3>
            <p className="text-gray-600">
              Book appointments through our intelligent AI assistant. Available in multiple languages, 24/7.
            </p>
          </div>

          {/* Shop Pages */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Shop Pages</h3>
            <p className="text-gray-600">
              Beautiful, detailed shop pages with photos, services, staff, and real-time availability.
            </p>
          </div>

          {/* Owner Dashboard */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Owner Dashboard</h3>
            <p className="text-gray-600">
              Manage bookings, availability, customer messages, and shop settings from one place.
            </p>
          </div>

          {/* Customer Dashboard */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Dashboard</h3>
            <p className="text-gray-600">
              View your bookings, saved shops, messages, and manage your profile easily.
            </p>
          </div>

          {/* Reviews (Coming) */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 opacity-75">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Reviews <span className="text-sm text-gray-500">(Coming)</span></h3>
            <p className="text-gray-600">
              Rate and review shops to help others make better decisions.
            </p>
          </div>

          {/* Analytics (Coming) */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 opacity-75">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics <span className="text-sm text-gray-500">(Coming)</span></h3>
            <p className="text-gray-600">
              Track performance, bookings, and customer insights with detailed analytics.
            </p>
          </div>

          {/* Payments (Coming) */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 opacity-75">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Payments <span className="text-sm text-gray-500">(Coming)</span></h3>
            <p className="text-gray-600">
              Secure online payments for bookings and services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <ServicesPageContent />
    </Suspense>
  );
}

