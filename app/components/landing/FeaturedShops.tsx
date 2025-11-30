"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

interface Shop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  image_url?: string;
  cover_photo_url?: string;
  logo_url?: string;
  claim_status?: string;
  categories?: {
    id: string;
    name: string;
  };
}

export default function FeaturedShops() {
  const t = useTranslations();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShops = async () => {
      try {
        // Fetch first page of shops (30 shops)
        const res = await fetch(`${apiUrl}/shops?page=1&limit=12`);
        if (res.ok) {
          const data = await res.json();
          const shopsArray = Array.isArray(data) 
            ? data 
            : (data.data && Array.isArray(data.data) 
              ? data.data 
              : (data.shops || []));
          
          // Filter out hidden shops
          const visibleShops = shopsArray.filter((shop: Shop) => 
            !shop.claim_status || shop.claim_status !== 'hidden'
          );
          
          setShops(visibleShops.slice(0, 12)); // Show first 12 shops
        }
      } catch (error) {
        console.error('Error loading shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, []);

  const getCategoryName = (categoryName: string) => {
    try {
      return t(`categories.${categoryName}`) || categoryName;
    } catch {
      return categoryName;
    }
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {t('landing.featuredShops') || 'Featured Shops'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (shops.length === 0) {
    return null; // Don't show section if no shops
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {t('landing.featuredShops') || 'Featured Shops'}
          </h2>
          <Link
            href="/browse"
            className="text-blue-600 hover:text-blue-700 font-medium text-lg"
          >
            {t('landing.viewAllShops') || 'View All Shops →'}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shops.map((shop) => {
            const imageUrl = shop.cover_photo_url || shop.image_url || shop.logo_url;
            return (
              <Link
                key={shop.id}
                href={`/shops/${shop.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-300 group"
              >
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-4xl">🏪</span>
                    </div>
                  )}
                  {shop.categories && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow-lg">
                        {getCategoryName(shop.categories.name)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {shop.name}
                  </h3>
                  {shop.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {shop.description.length > 100 
                        ? shop.description.substring(0, 100) + '...' 
                        : shop.description}
                    </p>
                  )}
                  {shop.address && (
                    <p className="text-gray-500 text-xs mb-4 line-clamp-1">
                      📍 {shop.address}
                    </p>
                  )}
                  <div className="mt-4">
                    <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg group-hover:bg-blue-700 transition-colors">
                      {t('shops.viewDetails') || 'View Details'} →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/browse"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('landing.browseAllShops') || 'Browse All Shops'}
          </Link>
        </div>
      </div>
    </section>
  );
}

