'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CATEGORIES } from '@/lib/categories';

// Map category imageKeys to Unsplash URLs (high-quality stock photos)
const categoryImageMap: Record<string, string> = {
  'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'hair-salon': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'barber': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
  'nails': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
  'eyelash': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
  'onsen': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  'spa': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
  'beauty-salon': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'dental': 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80',
  'womens-clinic': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&q=80',
  'golf': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  'karaoke': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
};

export default function CategoryGrid() {
  const locale = useLocale();
  const isJapanese = locale === 'ja';

  return (
    <section className="py-16 md:py-24 bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-primary-text mb-12">
          {isJapanese ? 'カテゴリーから探す' : 'Browse by Category'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.map((category) => {
            const imageUrl = categoryImageMap[category.imageKey] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
            const categoryName = isJapanese ? category.nameJa : category.name;

            return (
              <Link
                key={category.id}
                href={`/browse?category=${category.id}`}
                className="group relative overflow-hidden rounded-theme bg-card-bg border-2 border-border-soft hover:border-accent-pink transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={imageUrl}
                    alt={categoryName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={true}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
                    }}
                  />
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  {/* Category name */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg md:text-xl font-heading font-bold text-white drop-shadow-lg">
                      {categoryName}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

