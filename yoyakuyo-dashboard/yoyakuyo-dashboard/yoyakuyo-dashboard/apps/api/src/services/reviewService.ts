// apps/api/src/services/reviewService.ts
// Review and rating service

import { supabaseAdmin, supabase } from '../lib/supabase';

const dbClient = supabaseAdmin || supabase;

export interface CreateReviewInput {
  shopId: string;
  bookingId?: string | null;
  customerId?: string | null;
  rating: number;
  comment?: string | null;
  photos?: string[] | null;
}

export interface ReviewStats {
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

/**
 * Create a new review
 */
export async function createReview(input: CreateReviewInput) {
  try {
    // Validate rating
    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Validate comment length
    if (input.comment && input.comment.length > 2000) {
      throw new Error('Comment must be 2000 characters or less');
    }

    // Validate photos
    if (input.photos && input.photos.length > 5) {
      throw new Error('Maximum 5 photos allowed per review');
    }

    // Check if booking exists and is completed (for verified reviews)
    let isVerified = false;
    if (input.bookingId) {
      const { data: booking, error: bookingError } = await dbClient
        .from('bookings')
        .select('status, customer_id')
        .eq('id', input.bookingId)
        .single();

      if (!bookingError && booking && booking.status === 'completed') {
        isVerified = true;
        // Ensure customer_id matches if provided
        if (input.customerId && booking.customer_id !== input.customerId) {
          throw new Error('Booking does not belong to this customer');
        }
      }
    }

    // Create review
    const { data: review, error } = await dbClient
      .from('reviews')
      .insert([
        {
          shop_id: input.shopId,
          booking_id: input.bookingId || null,
          customer_id: input.customerId || null,
          rating: input.rating,
          comment: input.comment || null,
          photos: input.photos || null,
          is_verified: isVerified,
          status: 'published', // Auto-publish for now, can add moderation later
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update shop rating stats
    await updateShopRatingStats(input.shopId);

    return { success: true, review };
  } catch (error: any) {
    console.error('Error creating review:', error);
    return { success: false, error: error.message || 'Failed to create review' };
  }
}

/**
 * Update shop rating statistics
 */
export async function updateShopRatingStats(shopId: string) {
  try {
    // Call the database function
    const { error } = await dbClient.rpc('update_shop_rating_stats', {
      shop_uuid: shopId,
    });

    if (error) {
      console.error('Error updating shop rating stats:', error);
      // Fallback: calculate manually
      const { data: reviews } = await dbClient
        .from('reviews')
        .select('rating')
        .eq('shop_id', shopId)
        .eq('status', 'published');

      if (reviews && reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const totalReviews = reviews.length;

        await dbClient
          .from('shops')
          .update({
            average_rating: Math.round(avgRating * 100) / 100,
            total_reviews: totalReviews,
          })
          .eq('id', shopId);
      } else {
        // No reviews, reset stats
        await dbClient
          .from('shops')
          .update({
            average_rating: null,
            total_reviews: 0,
          })
          .eq('id', shopId);
      }
    }
  } catch (error) {
    console.error('Error in updateShopRatingStats:', error);
  }
}

/**
 * Get review statistics for a shop
 */
export async function getShopReviewStats(shopId: string): Promise<ReviewStats> {
  try {
    const { data: reviews, error } = await dbClient
      .from('reviews')
      .select('rating')
      .eq('shop_id', shopId)
      .eq('status', 'published');

    if (error) {
      throw error;
    }

    if (!reviews || reviews.length === 0) {
      return {
        averageRating: null,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const distribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews,
      ratingDistribution: distribution,
    };
  } catch (error) {
    console.error('Error getting shop review stats:', error);
    return {
      averageRating: null,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
}

/**
 * Verify if a customer is eligible to leave a verified review
 */
export async function verifyReviewEligibility(
  bookingId: string,
  customerId: string
): Promise<boolean> {
  try {
    const { data: booking, error } = await dbClient
      .from('bookings')
      .select('status, customer_id')
      .eq('id', bookingId)
      .eq('customer_id', customerId)
      .single();

    if (error || !booking) {
      return false;
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return false;
    }

    // Check if customer already left a review for this booking
    const { data: existingReview } = await dbClient
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .limit(1);

    return !existingReview || existingReview.length === 0;
  } catch (error) {
    console.error('Error verifying review eligibility:', error);
    return false;
  }
}

