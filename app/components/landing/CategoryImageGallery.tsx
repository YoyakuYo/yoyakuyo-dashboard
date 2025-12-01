"use client";

import React from 'react';
import Image from 'next/image';
import { Category, getAllCategoryImageUrls, getCategoryName } from '@/lib/categories';

interface CategoryImageGalleryProps {
  category: Category;
  locale: string;
}

/**
 * Component to display all 5 image variations for a category
 * Useful for category detail pages or image selection
 */
export default function CategoryImageGallery({ category, locale }: CategoryImageGalleryProps) {
  const categoryName = getCategoryName(category, locale);
  const imageUrls = getAllCategoryImageUrls(category, 600, 400);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {imageUrls.map((url, index) => (
        <div
          key={index}
          className="relative aspect-[3/2] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all group"
        >
          <Image
            src={url}
            alt={`${categoryName} - Image ${index + 1}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm font-medium">
                {categoryName} - Variation {index + 1}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

