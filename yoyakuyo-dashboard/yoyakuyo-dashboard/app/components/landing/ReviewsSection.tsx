"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { useAuth } from '@/lib/useAuth';

interface PlatformReview {
  id: string;
  rating: number;
  comment?: string;
  customer_name?: string;
  created_at: string;
}

export default function ReviewsSection() {
  const t = useTranslations();
  const { user } = useAuth(); // Check if user is logged in
  const isGuest = !user; // Guest if not logged in
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState(''); // PART 1: Guest name field
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      console.log('[ReviewsSection] Fetching reviews from:', `${apiUrl}/reviews/platform-reviews?limit=10`);
      const response = await fetch(`${apiUrl}/reviews/platform-reviews?limit=10`);
      console.log('[ReviewsSection] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[ReviewsSection] Fetched reviews:', data);
        console.log('[ReviewsSection] Number of reviews:', Array.isArray(data) ? data.length : 0);
        setReviews(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('[ReviewsSection] Failed to fetch reviews:', response.status, errorText);
        setReviews([]); // Ensure empty array on error
      }
    } catch (error) {
      console.error('[ReviewsSection] Error fetching platform reviews:', error);
      setReviews([]); // Ensure empty array on error
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // PART 1: Validate guest name if guest
    if (isGuest && !guestName.trim()) {
      setError(t('reviews.pleaseEnterName'));
      return;
    }

    // Rating is optional - allow submission with just a comment
    if (rating === 0 && (!comment || comment.trim().length === 0)) {
      setError(t('reviews.pleaseProvideRating'));
      return;
    }

    if (comment && comment.length > 2000) {
      setError(t('reviews.reviewMaxLength'));
      return;
    }

    // If no rating provided, default to 3 (neutral)
    const finalRating = rating === 0 ? 3 : rating;

    setSubmitting(true);
    setError(null);

    try {
      // Submit platform review (not shop-specific)
      console.log('[ReviewsSection] Submitting review:', { rating: finalRating, comment: comment.trim(), guest_name: isGuest ? guestName.trim() : undefined });
      const response = await fetch(`${apiUrl}/reviews/platform-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: finalRating,
          comment: comment.trim() || undefined,
          guest_name: isGuest ? guestName.trim() : undefined, // PART 1: Include guest name
          platform: 'yoyakuyo',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit review' }));
        console.error('[ReviewsSection] Review submission failed:', response.status, errorData);
        throw new Error(errorData.error || t('reviews.failedToSubmit'));
      }

      const submittedReview = await response.json();
      console.log('[ReviewsSection] Review submitted successfully:', submittedReview);

      // Small delay to ensure database commit completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh reviews list to show the new review
      await fetchReviews();
      
      setSubmitted(true);
      setRating(0);
      setComment('');
      setGuestName(''); // PART 1: Clear guest name
      
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('reviews.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Share Your Experience
          </h2>
          <p className="text-lg text-gray-600">
            How was your experience using Yoyaku Yo? We'd love to hear from you!
          </p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">✓</div>
            <h3 className="text-lg font-semibold text-green-800 mb-1">Thank you for your review!</h3>
            <p className="text-green-700 text-sm">{t('reviews.feedbackHelps')}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {/* PART 1: Guest Name Field - Only show for guests */}
            {isGuest && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your name *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('reviews.enterYourName')}
                />
              </div>
            )}

            {/* Rating Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate your experience (optional)
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-4xl focus:outline-none transition-transform hover:scale-110"
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
              {rating > 0 && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Great!'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Fair'}
                  {rating === 1 && 'Poor'}
                </p>
              )}
            </div>

            {/* Review Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reviews.tellUsAboutExperience')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={t('reviews.experiencePlaceholder')}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {comment.length}/2000 {t('common.characters')}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? t('common.submitting') : t('reviews.submit')}
              </button>
            </div>
          </form>
        </div>

        {/* Display Submitted Reviews - ALWAYS VISIBLE */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {reviews.length > 0 ? t('reviews.whatOthersAreSaying') : t('reviews.title')}
          </h3>
          
          {loadingReviews ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {review.rating === 5 && 'Excellent'}
                        {review.rating === 4 && 'Great'}
                        {review.rating === 3 && 'Good'}
                        {review.rating === 2 && 'Fair'}
                        {review.rating === 1 && 'Poor'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}
                  {review.customer_name && (
                    <p className="text-sm text-gray-500 mt-3">
                      — {review.customer_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 text-lg">
                Be the first to share your experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
