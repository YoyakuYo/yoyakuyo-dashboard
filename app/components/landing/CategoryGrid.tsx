'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CATEGORIES, getTopLevelCategories, getSubcategories, hasSubcategories } from '@/lib/categories';
import { getCategoryImages, getCategoryMarketing } from '@/lib/categoryImages';

export default function CategoryGrid() {
  const locale = useLocale();
  const pathname = usePathname();
  const isJapanese = locale === 'ja';
  const isCustomerDashboard = pathname?.startsWith('/customer');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});

  // Get only top-level categories (not subcategories)
  const topLevelCategories = getTopLevelCategories();

  const handleImageChange = (categoryId: string, direction: 'next' | 'prev') => {
    const images = getCategoryImages(CATEGORIES.find(c => c.id === categoryId)?.imageKey || '');
    const currentIndex = currentImageIndex[categoryId] || 0;
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % images.length
      : (currentIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prev => ({ ...prev, [categoryId]: newIndex }));
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-gray-900 mb-12">
          {isJapanese ? 'カテゴリーから探す' : 'Browse by Category'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {topLevelCategories.map((category) => {
            const images = getCategoryImages(category.imageKey);
            const marketing = getCategoryMarketing(category.imageKey);
            const currentIndex = currentImageIndex[category.id] || 0;
            const currentImage = images[currentIndex];
            const categoryName = isJapanese ? category.nameJa : category.name;
            const categoryDescription = marketing ? (isJapanese ? marketing.descriptionJa : marketing.description) : '';
            const subcategories = getSubcategories(category.id);
            const hasSubs = hasSubcategories(category.id);
            const isExpanded = expandedCategory === category.id;

            return (
              <div
                key={category.id}
                className="group relative"
                onMouseEnter={() => setExpandedCategory(category.id)}
                onMouseLeave={() => setExpandedCategory(null)}
              >
                <Link
                  href={isCustomerDashboard 
                    ? `/customer/shops?category=${category.id}` 
                    : `/browse?category=${category.id}`}
                  className="relative overflow-hidden rounded-theme bg-white border-2 border-gray-200 hover:border-accent-pink transition-all duration-300 shadow-lg hover:shadow-xl block"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {/* Image carousel - Only show if images exist */}
                    {images.length > 0 && currentImage && (
                      <div className="relative w-full h-full">
                        <Image
                          src={currentImage}
                          alt={categoryName}
                          fill
                          className="object-cover transition-opacity duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized={true}
                        />
                      
                        {/* Image navigation arrows (show on hover) */}
                        {images.length > 1 && isExpanded && (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageChange(category.id, 'prev');
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 z-10 transition-all"
                              aria-label="Previous image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleImageChange(category.id, 'next');
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 z-10 transition-all"
                              aria-label="Next image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            
                            {/* Image indicators */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                              {images.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    idx === currentIndex ? 'bg-white' : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Background color when no image */}
                    {images.length === 0 && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"></div>
                    )}
                    
                    {/* Category name and description - Clean, no overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
                      <h3 className="text-lg md:text-xl font-heading font-bold text-white drop-shadow-lg mb-1">
                        {categoryName}
                      </h3>
                      {categoryDescription && (
                        <p className="text-xs md:text-sm text-white/90 drop-shadow-md line-clamp-2 mb-1">
                          {categoryDescription}
                        </p>
                      )}
                      {hasSubs && (
                        <p className="text-xs text-white/70">
                          {subcategories.length} {isJapanese ? 'サブカテゴリー' : 'subcategories'}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

