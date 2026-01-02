// apps/dashboard/app/components/ReviewStats.tsx
// Component to display review statistics for a shop

"use client";
import React from 'react';
import { useTranslations } from 'next-intl';

interface ReviewStatsProps {
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewStats({
  averageRating,
  totalReviews,
  ratingDistribution,
}: ReviewStatsProps) {
  const t = useTranslations();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-2xl ${
          i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-6 mb-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {averageRating ? averageRating.toFixed(1) : '—'}
          </div>
          <div className="flex justify-center mb-2">
            {averageRating ? renderStars(averageRating) : renderStars(0)}
          </div>
          <div className="text-sm text-gray-600">
            {totalReviews} {t('reviews.totalReviews')}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution];
            const percentage = getPercentage(count);
            return (
              <div key={rating} className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600 w-8">{rating} ★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

