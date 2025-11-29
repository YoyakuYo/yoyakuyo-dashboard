'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CATEGORIES } from '@/lib/categories';

// Map category imageKeys to imgur URLs for beautiful representative images
const categoryImageMap: Record<string, string> = {
  'restaurant': 'https://i.imgur.com/TkZD01Y.jpeg',
  'hotel': 'https://i.imgur.com/JUO6xWJ.jpeg',
  'hair-salon': 'https://i.imgur.com/1QZYzj7.jpeg',
  'barber': 'https://i.imgur.com/bmwxF0D.jpeg',
  'nails': 'https://i.imgur.com/vZrU0VU.jpeg',
  'eyelash': 'https://i.imgur.com/XGuT0DR.jpeg',
  'onsen': 'https://i.imgur.com/2cUypPf.jpeg',
  'spa': 'https://i.imgur.com/WT0uox2.jpeg',
  'beauty-salon': 'https://i.imgur.com/1QZYzj7.jpeg',
  'dental': 'https://i.imgur.com/YERkZiK.jpeg',
  'womens-clinic': 'https://i.imgur.com/YERkZiK.jpeg',
  'golf': 'https://i.imgur.com/JC2qkQn.jpeg',
  'karaoke': 'https://i.imgur.com/JOuGk4V.jpeg',
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
            const imageUrl = categoryImageMap[category.imageKey] || 'https://i.imgur.com/1QZYzj7.jpeg';
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
                      (e.target as HTMLImageElement).src = 'https://i.imgur.com/1QZYzj7.jpeg';
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

