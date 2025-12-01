"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { getAllCategories, getCategoryName } from '@/lib/categories';
import CategoryImageGallery from '../components/landing/CategoryImageGallery';

export default function CategoryImagesPage() {
  const locale = useLocale();
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Category Image Gallery
          </h1>
          <p className="text-lg text-gray-600">
            View all 5 image variations for each category
          </p>
        </div>

        <div className="space-y-16">
          {categories.map((category) => {
            const categoryName = getCategoryName(category, locale);
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {categoryName}
                </h2>
                <p className="text-gray-600 mb-6 text-sm">
                  {category.nameJa} • {category.id}
                </p>
                <CategoryImageGallery category={category} locale={locale} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

