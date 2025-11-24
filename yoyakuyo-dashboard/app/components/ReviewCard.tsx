// apps/dashboard/app/components/ReviewCard.tsx
// Component to display a single review

"use client";
import React from 'react';
import { useTranslations } from 'next-intl';

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  photos?: string[] | null;
  is_verified?: boolean;
  owner_response?: string | null;
  owner_response_at?: string | null;
  created_at: string;
  customer_id?: string | null;
  customers?: { id: string } | null;
}

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const t = useTranslations();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xl ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header: Rating and Date */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(review.rating)}</div>
          {review.is_verified && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {t('reviews.verified')}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(review.created_at)}
        </span>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">
          {review.comment}
        </p>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Review photo ${index + 1}`}
              className="w-full h-24 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* Owner Response */}
      {review.owner_response && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-800">
              {t('reviews.ownerResponse')}
            </span>
            {review.owner_response_at && (
              <span className="text-xs text-gray-500">
                {formatDate(review.owner_response_at)}
              </span>
            )}
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">
            {review.owner_response}
          </p>
        </div>
      )}
    </div>
  );
}

