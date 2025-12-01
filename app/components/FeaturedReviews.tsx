// apps/dashboard/app/components/FeaturedReviews.tsx
// Component to display featured reviews from the database

"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';

interface FeaturedReview {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_category: string | null;
  rating: number;
  comment: string | null;
  photos: string[] | null;
  is_verified: boolean;
  created_at: string;
  customer_id: string | null;
}

export default function FeaturedReviews() {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const isJapanese = locale === 'ja';

  let t: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Use the same API client as the rest of the app
        const { apiUrl } = await import('@/lib/apiClient');
        const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/reviews/featured?limit=6`);
        
        if (response.ok) {
          const data = await response.json();
          setReviews(data || []);
        } else {
          console.warn('Failed to fetch reviews, using empty array');
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">{isJapanese ? '読み込み中...' : 'Loading reviews...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show section if no reviews
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese ? 'お客様の声' : 'What Our Customers Say'}
          </h2>
          <p className={`text-lg text-gray-600 max-w-2xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese 
              ? '実際にご利用いただいたお客様からの本物のレビュー'
              : 'Real reviews from customers who have used Yoyaku Yo'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    {review.is_verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {isJapanese ? '確認済み' : 'Verified'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {review.shop_name}
                  </p>
                  {review.shop_category && (
                    <p className="text-xs text-gray-500">{review.shop_category}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(review.created_at)}
                </span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className={`text-gray-700 mb-4 line-clamp-3 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {review.comment}
                </p>
              )}

              {/* Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {review.photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="relative w-full h-20 rounded overflow-hidden">
                      <Image
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {reviews.length > 0 && (
          <div className="text-center mt-8">
            <p className={`text-sm text-gray-600 ${isJapanese ? 'font-japanese' : ''}`}>
              {isJapanese 
                ? 'すべてのレビューは実際の予約から取得されています'
                : 'All reviews are from real bookings'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

