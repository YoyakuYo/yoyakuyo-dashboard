// apps/dashboard/app/page.tsx
// New Marketing Landing Page - Layout A (bright travel) + Layout C (dark highlights)

"use client";

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { getTopLevelCategories } from '@/lib/categories';
import { getCategoryImages, getCategoryMarketing } from '@/lib/categoryImages';
import OwnerModals from './components/OwnerModals';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function HomeContent() {
  let t: ReturnType<typeof useTranslations>;
  let tHome: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tHome = useTranslations('home');
  } catch (error) {
    console.warn("useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tHome = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const categoryPreviewRef = useRef<HTMLDivElement>(null);
  const topLevelCategories = getTopLevelCategories();
  // Show 4-6 categories in preview
  const previewCategories = topLevelCategories.slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=80"
            alt="Yoyaku Yo Hero"
            fill
            className="object-cover"
            priority
            unoptimized={true}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-800/60 to-blue-900/70"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {tHome('heroTitle') || "Japan's Premier Booking Platform"}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {tHome('heroSubtitle') || "Book salons, clinics, hotels, and more across Japan."}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — FEATURE SUMMARY CARDS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tHome('feature1Title') || 'Search Anywhere in Japan'}
              </h3>
              <p className="text-gray-600">
                {tHome('feature1Text') || 'Browse verified salons, clinics, hotels, and more in every major region.'}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tHome('feature2Title') || 'AI Recommends the Best Match'}
              </h3>
              <p className="text-gray-600">
                {tHome('feature2Text') || 'Ask in your language and let AI find times, suggest shops, and handle bookings.'}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tHome('feature3Title') || 'Instant Online Booking'}
              </h3>
              <p className="text-gray-600">
                {tHome('feature3Text') || 'No phone calls or long forms—book in a few messages and track everything online.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — CATEGORY PREVIEW */}
      <section ref={categoryPreviewRef} className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {tHome('categoryPreviewTitle') || 'Browse by Category'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tHome('categoryPreviewSubtitle') || 'Explore popular categories.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {previewCategories.map((category) => {
              const images = getCategoryImages(category.imageKey);
              const marketing = getCategoryMarketing(category.imageKey);
              const categoryName = category.name;
              const currentImage = images[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';

              return (
                <Link
                  key={category.id}
                  href={`/categories?category=${category.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {currentImage && (
                      <Image
                        src={currentImage}
                        alt={categoryName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized={true}
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm">{categoryName}</h3>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/categories"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tHome('viewAllCategories') || 'View all categories →'}
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — OWNER/CUSTOMER MARKETING STRIP */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left: For Customers */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {tHome('forCustomersTitle') || 'For Customers'}
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tHome('customerBullet1') || 'Search shops by category or location'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tHome('customerBullet2') || 'Book instantly with AI assistance'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tHome('customerBullet3') || 'Save favorites and keep your booking history'}</span>
                </li>
              </ul>
            </div>

            {/* Right: For Owners */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {tHome('forOwnersTitle') || 'For Owners'}
              </h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tHome('ownerBullet1') || 'Manage bookings & availability'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tHome('ownerBullet2') || 'Handle customer messages automatically with AI'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tHome('ownerBullet3') || 'See simple analytics for performance'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — DARK HIGHLIGHTS PREVIEW (C-style) */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            {tHome('highlightsTitle') || 'Discover Top Shops'}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Featured Card */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-cyan-500 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">
                {tHome('featuredCardTitle') || 'Featured Shops'}
              </h3>
              <p className="text-gray-300 mb-6">
                {tHome('featuredCardText') || 'Our most recommended and highly-rated partners.'}
              </p>
              <Link
                href="/featured"
                className="inline-block px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                {tHome('viewFeatured') || 'View Featured →'}
              </Link>
            </div>

            {/* Trending Card */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-cyan-500 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">
                {tHome('trendingCardTitle') || 'Trending Now'}
              </h3>
              <p className="text-gray-300 mb-6">
                {tHome('trendingCardText') || 'Shops people are booking most.'}
              </p>
              <Link
                href="/trending"
                className="inline-block px-6 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                {tHome('viewTrending') || 'View Trending →'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Login/Signup Modals */}
      <OwnerModals />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
