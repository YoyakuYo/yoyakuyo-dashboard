"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Japanese night scene images for the carousel
const heroImages = [
  'https://source.unsplash.com/1920x1080/?tokyo-night-street-lights',
  'https://source.unsplash.com/1920x1080/?japanese-izakaya-alley-night',
  'https://source.unsplash.com/1920x1080/?japanese-hotel-night-exterior',
  'https://source.unsplash.com/1920x1080/?japanese-onsen-night-traditional',
  'https://source.unsplash.com/1920x1080/?japanese-countryside-night-mountain',
  'https://source.unsplash.com/1920x1080/?osaka-night-neon-lights',
];

export default function HeroCarousel() {
  const t = useTranslations('landing');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[75vh] min-h-[600px] overflow-hidden">
      {/* Background Images with Fade Transition */}
      {heroImages.map((imageUrl, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={imageUrl}
            alt={`Hero background ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
            unoptimized
          />
        </div>
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Hero Content - Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            {t('heroMainTitle')}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white mb-4 font-light">
            {t('heroMainSubtitle')}
          </p>
          <p className="text-base md:text-lg lg:text-xl text-white/80 font-light">
            {t('heroTagline')}
          </p>
        </div>
      </div>
    </div>
  );
}
