"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface CategoryCardProps {
  title: string;
  titleJa: string;
  description: string;
  sellingPoints: string[];
  imageSearchTerms: string[];
  categoryId: string;
}

export default function CategoryCard({
  title,
  titleJa,
  description,
  sellingPoints,
  imageSearchTerms,
  categoryId,
}: CategoryCardProps) {
  const t = useTranslations('landing');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);

  // Generate image URLs from search terms or use direct URLs
  useEffect(() => {
    const urls = imageSearchTerms.map((term) => {
      // If term is already a URL (starts with http), use it directly
      if (term.startsWith('http://') || term.startsWith('https://')) {
        return term;
      }
      // Otherwise, treat it as a search term and generate Unsplash URL
      return `https://source.unsplash.com/1200x800/?${encodeURIComponent(term)}`;
    });
    setImageUrls(urls);
    setImagesLoaded(new Array(urls.length).fill(false));
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
    <div className="bg-japanese-paper rounded-xl shadow-lg overflow-hidden border-2 border-japanese-sage/20 hover:border-japanese-red/40 hover:shadow-2xl transition-all duration-300">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Left Side: Image Slider */}
        <div className="relative h-72 md:h-full min-h-[300px]">
          {imageUrls.length > 0 && (
            <>
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${title} ${index + 1}`}
                    fill
                    className="object-cover object-center rounded-xl"
                    unoptimized
                    onLoad={() => {
                      const newLoaded = [...imagesLoaded];
                      newLoaded[index] = true;
                      setImagesLoaded(newLoaded);
                    }}
                    onError={() => {
                      // Fallback to a placeholder if image fails to load
                      console.warn(`Failed to load image ${index + 1} for ${title}`);
                    }}
                  />
                </div>
              ))}
              {/* Image Indicators */}
              {imageUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'w-8 bg-japanese-red'
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
        <div className="p-6 md:p-8 flex flex-col justify-center bg-japanese-paper">
          <h3 className="text-2xl md:text-3xl font-bold text-japanese-charcoal mb-2">
            {title}
          </h3>
          <p className="text-sm text-japanese-teal mb-4 font-medium">{titleJa}</p>
          
          <p className="text-japanese-charcoal/80 mb-6 leading-relaxed">{description}</p>

          {/* Selling Points */}
          <ul className="space-y-2 mb-6">
            {sellingPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-japanese-charcoal/70">
                <span className="text-japanese-red mt-1 font-bold text-lg">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {/* View Shops Button */}
          <Link
            href="/browse"
            className="inline-block w-full text-center bg-japanese-red hover:bg-japanese-red/90 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
          >
            {t('viewShops')}
          </Link>
        </div>
      </div>
    </div>
  );
}
