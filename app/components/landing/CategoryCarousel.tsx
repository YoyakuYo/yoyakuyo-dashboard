"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { getAllCategories, getCategoryName, getUnsplashImageUrl } from '@/lib/categories';

export default function CategoryCarousel() {
  const locale = useLocale();
  const categories = getAllCategories();

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-4 px-4 md:px-8">
        {categories.map((category) => {
          const categoryName = getCategoryName(category, locale);
          const imageUrl = getUnsplashImageUrl(category.unsplashSearch, 400, 300);

          return (
            <Link
              key={category.id}
              href={`/categories?category=${category.id}`}
              className="group relative flex-shrink-0 w-64 md:w-80 h-48 md:h-56 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
            >
              {/* Category Image */}
              <div className="absolute inset-0">
                <Image
                  src={imageUrl}
                  alt={categoryName}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  unoptimized
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Category Name Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 className="text-white font-bold text-lg md:text-xl mb-1 drop-shadow-lg">
                  {categoryName}
                </h3>
                <p className="text-white/90 text-xs md:text-sm drop-shadow-md">
                  {category.nameJa}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

