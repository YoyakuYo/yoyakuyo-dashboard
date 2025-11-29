'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { landingSlides } from './categorySlides';

interface HeroCarouselProps {
  onSlideChange?: (slideId: string) => void;
}

export default function HeroCarousel({ onSlideChange }: HeroCarouselProps) {
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const currentSlide = landingSlides[currentIndex];
  const isJapanese = locale === 'ja';

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused || landingSlides.length === 0) return;

    const interval = setInterval(() => {
      setFadeKey((prev) => prev + 1);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % landingSlides.length);
      }, 500); // After fade starts
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToSlide = useCallback((index: number) => {
    setFadeKey((prev) => prev + 1);
    setTimeout(() => {
      setCurrentIndex(index);
      if (onSlideChange) {
        onSlideChange(landingSlides[index].id);
      }
    }, 100);
  }, [onSlideChange]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? landingSlides.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = (currentIndex + 1) % landingSlides.length;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  // Get image path - maps slide IDs to imgur URLs
  const getImagePath = (slideId: string) => {
    // Map each slide ID to its corresponding imgur URL
    const imageMap: Record<string, string> = {
      // HAIR
      'hair-salon-environment': 'https://i.imgur.com/1QZYzj7.jpeg',
      'hair-salon-action': 'https://i.imgur.com/bmwxF0D.jpeg',
      // NAILS
      'nail-salon-environment': 'https://i.imgur.com/vZrU0VU.jpeg',
      'nail-salon-action': 'https://i.imgur.com/EjzknWe.jpeg',
      // EYELASH
      'eyelash-environment': 'https://i.imgur.com/XGuT0DR.jpeg',
      'eyelash-action': 'https://i.imgur.com/hDi1YEq.jpeg',
      // SPA
      'spa-environment': 'https://i.imgur.com/WT0uox2.jpeg',
      'spa-action': 'https://i.imgur.com/ucUgid2.jpeg',
      // HOTEL
      'hotel-environment': 'https://i.imgur.com/JUO6xWJ.jpeg',
      'hotel-action': 'https://i.imgur.com/JC2qkQn.jpeg',
      // RESTAURANT
      'restaurant-environment': 'https://i.imgur.com/TkZD01Y.jpeg',
      'restaurant-action': 'https://i.imgur.com/JOuGk4V.jpeg',
      // ONSEN
      'onsen-environment': 'https://i.imgur.com/2cUypPf.jpeg',
      'onsen-action': 'https://i.imgur.com/2cUypPf.jpeg', // Using same as environment (no separate action URL provided)
      // CLINIC
      'clinic-environment': 'https://i.imgur.com/YERkZiK.jpeg',
      'clinic-action': 'https://i.imgur.com/YERkZiK.jpeg', // Using same as environment (no separate action URL provided)
    };
    
    return imageMap[slideId] || 'https://i.imgur.com/1QZYzj7.jpeg'; // Fallback to hair salon image
  };

  const title = isJapanese ? currentSlide.titleJa : currentSlide.titleEn;
  const subtitle = isJapanese ? currentSlide.subtitleJa : currentSlide.subtitleEn;
  const isLeftCaption = currentSlide.layoutHint === 'left-caption';

  return (
    <section
      className="relative w-full h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden bg-primary-bg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image with fade transition */}
      <div key={fadeKey} className="absolute inset-0">
        <Image
          src={getImagePath(currentSlide.id)}
          alt={title}
          fill
          priority={currentIndex < 3}
          className="object-cover transition-opacity duration-1000"
          sizes="100vw"
          unoptimized={true}
          onError={(e) => {
            // Fallback to hair salon image if image fails
            (e.target as HTMLImageElement).src = 'https://i.imgur.com/1QZYzj7.jpeg';
          }}
        />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

      {/* Caption Card - Desktop: Left or Right, Mobile: Bottom */}
      <div className={`
        absolute z-20
        md:absolute md:top-1/2 md:-translate-y-1/2
        ${isLeftCaption ? 'md:left-8 lg:left-16' : 'md:right-8 lg:right-16'}
        bottom-8 left-4 right-4
        md:max-w-lg lg:max-w-xl
        bg-card-bg/95 backdrop-blur-sm
        border border-border-soft
        rounded-theme
        p-6 md:p-8 lg:p-10
        transition-all duration-500
      `}>
        <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-primary-text mb-3 md:mb-4">
          {title}
        </h2>
        <p className="font-body text-muted-text text-base md:text-lg leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30
                   bg-card-bg/80 hover:bg-card-bg/90
                   border border-border-soft
                   rounded-full p-3 md:p-4
                   text-primary-text hover:text-accent-blue
                   transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30
                   bg-card-bg/80 hover:bg-card-bg/90
                   border border-border-soft
                   rounded-full p-3 md:p-4
                   text-primary-text hover:text-accent-blue
                   transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {landingSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              transition-all duration-300 rounded-full
              ${index === currentIndex
                ? 'w-8 h-2 bg-accent-blue'
                : 'w-2 h-2 bg-muted-text/60 hover:bg-muted-text/80'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

