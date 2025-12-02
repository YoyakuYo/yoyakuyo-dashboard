"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUnsplashImageUrl } from '@/lib/categories';

interface CategoryCardProps {
  categoryName: string;
  categoryNameJa: string;
  description: string;
  sellingPoints: string[];
  subcategories: string[];
  imageSearchTerms: string[];
  categoryId: string;
}

export default function CategoryCard({
  categoryName,
  categoryNameJa,
  description,
  sellingPoints,
  subcategories,
  imageSearchTerms,
  categoryId,
}: CategoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Generate image URLs from search terms
  useEffect(() => {
    const urls = imageSearchTerms.map((term) => 
      getUnsplashImageUrl(term, 800, 600)
    );
    setImageUrls(urls);
  }, [imageSearchTerms]);

  // Auto-advance image slider
  useEffect(() => {
    if (imageUrls.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [imageUrls.length]);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Left Side: Image Slider */}
        <div className="relative h-64 md:h-full min-h-[300px]">
          {imageUrls.length > 0 && (
            <>
              <Image
                src={imageUrls[currentImageIndex]}
                alt={categoryName}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Image Indicators */}
              {imageUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'w-8 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {categoryName}
          </h3>
          <p className="text-lg text-gray-600 mb-4">{categoryNameJa}</p>
          
          <p className="text-gray-700 mb-6">{description}</p>

          {/* Selling Points */}
          <ul className="space-y-2 mb-6">
            {sellingPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-pink-600 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {/* Subcategories */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2">Subcategories:</p>
            <p className="text-sm text-gray-600">{subcategories.join(', ')}</p>
          </div>

          {/* View Shops Button */}
          <Link
            href="/browse"
            className="inline-block w-full text-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            View Shops
          </Link>
        </div>
      </div>
    </div>
  );
}

