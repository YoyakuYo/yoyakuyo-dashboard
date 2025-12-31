// app/components/landing/CommercialHero.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// Hero slideshow images - clean, minimal
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
];

export default function CommercialHero() {
  const t = useTranslations('home');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
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
            />
          </div>
        ))}
      </div>

      {/* Subtle Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content - Centered, Clean */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {t('welcomeTitle')}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 drop-shadow-md">
            {t('welcomeSubtitle')}
          </p>
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

