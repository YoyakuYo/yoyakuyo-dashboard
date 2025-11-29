'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CATEGORIES, getTopLevelCategories, getSubcategories, hasSubcategories } from '@/lib/categories';
import { getCategoryImages } from '@/lib/categoryImages';

export default function CategoryGrid() {
  const locale = useLocale();
  const isJapanese = locale === 'ja';
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
            const currentIndex = currentImageIndex[category.id] || 0;
            const currentImage = images[currentIndex];
            const categoryName = isJapanese ? category.nameJa : category.name;
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
                  href={`/browse?category=${category.id}`}
                  className="relative overflow-hidden rounded-theme bg-white border-2 border-gray-200 hover:border-accent-pink transition-all duration-300 shadow-lg hover:shadow-xl block"
                >
                  <div className="relative aspect-[4/3] w-full">
                    {/* Image carousel */}
                    <div className="relative w-full h-full">
                      <Image
                        src={currentImage}
                        alt={categoryName}
                        fill
                        className="object-cover transition-opacity duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized={true}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
                        }}
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
                    
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Category name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg md:text-xl font-heading font-bold text-white drop-shadow-lg">
                        {categoryName}
                      </h3>
                      {hasSubs && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {subcategories.slice(0, 3).map((subcat) => (
                            <span
                              key={subcat.id}
                              className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/browse?category=${subcat.id}`;
                              }}
                            >
                              {isJapanese ? subcat.nameJa : subcat.name}
                            </span>
                          ))}
                          {subcategories.length > 3 && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                              +{subcategories.length - 3}
                            </span>
                          )}
                        </div>
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

