// apps/dashboard/app/categories/page.tsx
// Full Category Browse Page

"use client";

import React, { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import CategoryGrid from '../components/landing/CategoryGrid';

export const dynamic = 'force-dynamic';

function CategoriesPageContent() {
  let t: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('home.categoryPreviewTitle') || 'Browse by Category'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('home.categoryPageSubtitle') || 'Explore all categories available on Yoyaku Yo.'}
          </p>
        </div>
        <CategoryGrid />
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <CategoriesPageContent />
    </Suspense>
  );
}

