// apps/dashboard/app/components/ReviewForm.tsx
// Component for customers to submit reviews

"use client";
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ReviewFormProps {
  shopId: string;
  bookingId?: string | null;
  customerId?: string | null;
  onSubmit: (review: {
    shop_id: string;
    booking_id?: string | null;
    customer_id?: string | null;
    rating: number;
    comment?: string;
    photos?: string[];
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function ReviewForm({
  shopId,
  bookingId,
  customerId,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const t = useTranslations();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.length > 2000) {
      setError('Comment must be 2000 characters or less');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        shop_id: shopId,
        booking_id: bookingId || null,
        customer_id: customerId || null,
        rating,
        comment: comment.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    // Convert files to base64 (in production, upload to storage first)
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold mb-4">{t('reviews.writeReview')}</h3>

      {/* Rating Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.rating')} *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-3xl focus:outline-none"
            >
              <span
                className={
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.comment')} ({t('common.optional')})
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t('reviews.comment')}
        />
        <div className="text-xs text-gray-500 mt-1">
          {comment.length}/2000 {t('common.characters')}
        </div>
      </div>

      {/* Photos */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.photos')} ({t('common.optional')}, max 5)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          disabled={photos.length >= 5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {photos.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mt-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('common.submitting') : t('reviews.submit')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

