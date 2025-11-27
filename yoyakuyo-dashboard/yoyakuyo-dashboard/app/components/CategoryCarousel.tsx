// apps/dashboard/app/components/CategoryCarousel.tsx
// Premium category showcase carousel for Japan business directory

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CATEGORIES, getCategoryImagePath } from '@/lib/categories';

export default function CategoryCarousel() {
  const t = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeKey, setFadeKey] = useState(0);

  // Get Japanese category name
  const getCategoryName = (category: typeof CATEGORIES[0]): string => {
    return category.nameJa;
  };

  // Auto-rotate carousel with smooth fade
  useEffect(() => {
    if (isPaused || CATEGORIES.length === 0) return;

    const interval = setInterval(() => {
      // Trigger fade by updating key
      setFadeKey((prev) => prev + 1);
      // Update index after fade animation starts
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % CATEGORIES.length);
      }, 1000); // After 1-second fade completes
    }, 4000); // 4-second interval

    return () => clearInterval(interval);
  }, [isPaused]);

  // Preload first 3 images
  useEffect(() => {
    const preloadImages = async () => {
      const imagesToPreload: Promise<void>[] = CATEGORIES.slice(0, 3).map((cat) => {
        return new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${cat.imageKey}`));
          img.src = getCategoryImagePath(cat.imageKey);
        });
      });

      try {
        await Promise.all(imagesToPreload);
        setIsLoading(false);
      } catch (error) {
        console.warn('Some category images failed to preload:', error);
        setIsLoading(false);
      }
    };

    preloadImages();
  }, []);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (CATEGORIES.length === 0) {
    return null;
  }

  const currentCategory = CATEGORIES[currentIndex];
  const categoryName = getCategoryName(currentCategory);

  return (
    <section
      className="relative w-full h-[600px] md:h-[700px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image with fade transition */}
      <div key={fadeKey} className="absolute inset-0">
        <Image
          src={getCategoryImagePath(currentCategory.imageKey)}
          alt={categoryName}
          fill
          priority={currentIndex < 3}
          className="object-cover transition-opacity duration-1000"
          sizes="100vw"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.jpg';
          }}
        />
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

      {/* Category name - huge white text at bottom center */}
      <div className="absolute bottom-0 left-0 right-0 pb-16 md:pb-20 px-4">
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white text-center drop-shadow-2xl">
          {categoryName}
        </h2>
      </div>

      {/* Indicator dots at bottom */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
        {CATEGORIES.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 h-2 bg-white rounded-full'
                : 'w-2 h-2 bg-white/60 rounded-full hover:bg-white/80'
            }`}
            aria-label={`Go to category ${index + 1}`}
          />
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">読み込み中...</div>
        </div>
      )}
    </section>
  );
}

