"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

// Hero slideshow images - DIFFERENT from customer page, using unique Unsplash images
const heroImages = [
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80',
    alt: 'Luxury hotel lobby',
  },
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=80',
    alt: 'Spa room with soft lighting',
  },
  {
    url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1920&q=80',
    alt: 'Modern beauty salon interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1920&q=80',
    alt: 'Beautiful nail salon',
  },
  {
    url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e0b09?w=1920&q=80',
    alt: 'Eyelash salon interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80',
    alt: 'Restaurant and izakaya interior',
  },
];

export default function MarketingHeroSlideshow() {
  const t = useTranslations('landing');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      {/* Slideshow Background */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
              unoptimized={true}
              onError={(e) => {
                // Fallback to gradient if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Fallback gradient - only shows if image fails */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 hidden" />
          </div>
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 drop-shadow-md">
            {t('heroSubtitle')}
          </p>

          {/* Button Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/customer-signup"
              className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg min-w-[200px]"
            >
              {t('joinAsCustomer')}
            </Link>
            <button
              onClick={() => {
                // Open owner signup modal (handled by parent)
                window.dispatchEvent(new CustomEvent('openSignupModal'));
              }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-white/30 hover:border-white/50 transition-all text-lg min-w-[200px]"
            >
              {t('joinAsOwner')}
            </button>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

