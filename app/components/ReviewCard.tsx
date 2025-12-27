// apps/dashboard/app/components/ReviewCard.tsx
// Component to display a single review

"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

interface Review {
  id: string;
  rating: number;
  comment?: string | null; // Legacy field
  content?: string | null; // New field (preferred)
  photos?: string[] | null;
  is_verified?: boolean;
  owner_response?: string | null;
  owner_response_at?: string | null;
  created_at: string;
  customer_id?: string | null;
  customers?: { id: string; name?: string } | null;
  // PART 6: Author type fields
  author_type?: 'guest' | 'user' | 'line' | null;
  guest_name?: string | null;
  line_user_id?: string | null;
  user_id?: string | null;
  status?: string | null;
}

interface ReviewCardProps {
  review: Review;
  currentUserId?: string | null;
  onChanged?: () => void;
}

export default function ReviewCard({ review, currentUserId, onChanged }: ReviewCardProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editRating, setEditRating] = React.useState<number>(review.rating);
  const [editContent, setEditContent] = React.useState<string>(String(review.content || review.comment || ""));

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

  const canEdit =
    !!currentUserId &&
    (review.author_type === 'user' || review.author_type == null) && // backward-compat
    (String(review.user_id || '') === String(currentUserId) || String(review.customer_id || '') === String(currentUserId));

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`${apiUrl}/reviews/${review.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
        },
        body: JSON.stringify({
          rating: editRating,
          content: editContent.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update review' }));
        throw new Error(err.error || err.details || 'Failed to update review');
      }

      setIsEditing(false);
      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`${apiUrl}/reviews/${review.id}`, {
        method: 'DELETE',
        headers: {
          ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
        } as any,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete review' }));
        throw new Error(err.error || err.details || 'Failed to delete review');
      }

      onChanged?.();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header: Rating and Date */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(isEditing ? editRating : review.rating)}</div>
          {review.is_verified && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {t('reviews.verified')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canEdit && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
          <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
        </div>
      </div>

      {/* Author Name - PART 6: Show name based on author_type */}
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-800">
          {review.guest_name || 
           (review.author_type === 'line' && review.line_user_id ? 'LINE User' : null) ||
           (review.customers?.name) || 
           'Customer'}
        </p>
      </div>

      {/* Comment/Content - PART 6: Support both comment and content */}
      {isEditing ? (
        <div className="mb-4 space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setEditRating(star)}
                className="text-2xl"
                aria-label={`Set rating ${star}`}
              >
                <span className={star <= editRating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              </button>
            ))}
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || editRating < 1 || editContent.trim().length === 0}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError(null);
                setEditRating(review.rating);
                setEditContent(String(review.content || review.comment || ""));
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        (review.content || review.comment) && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">
            {review.content || review.comment}
          </p>
        )
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

