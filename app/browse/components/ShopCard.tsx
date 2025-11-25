// app/browse/components/ShopCard.tsx
// Shop card component for displaying shop information in browse page

"use client";
import React from 'react';
import Link from 'next/link';
import type { Shop } from '@/lib/browse/shopBrowseData';

interface ShopCardProps {
  shop: Shop;
  getCategoryName: (name: string) => string;
  t: any;
}

export function ShopCard({ shop, getCategoryName, t }: ShopCardProps) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {shop.image_url && (
        <div className="w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={shop.image_url}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{shop.name}</h3>
          {shop.categories && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {getCategoryName(shop.categories.name)}
            </span>
          )}
        </div>
        {shop.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {shop.description.length > 100 ? shop.description.substring(0, 100) + '...' : shop.description}
          </p>
        )}
        <p className="text-gray-500 text-sm mb-4">{shop.address}</p>
        <div className="mt-4">
          <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg">
            {t('shops.viewDetails')} →
          </span>
        </div>
      </div>
    </Link>
  );
}

