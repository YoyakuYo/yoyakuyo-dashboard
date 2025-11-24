"use strict";
// apps/api/src/services/reviewService.ts
// Review and rating service
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.updateShopRatingStats = updateShopRatingStats;
exports.getShopReviewStats = getShopReviewStats;
exports.verifyReviewEligibility = verifyReviewEligibility;
const supabase_1 = require("../lib/supabase");
const dbClient = supabase_1.supabaseAdmin || supabase_1.supabase;
/**
 * Create a new review
 */
function createReview(input) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const { data: booking, error: bookingError } = yield dbClient
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
            const { data: review, error } = yield dbClient
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
            yield updateShopRatingStats(input.shopId);
            return { success: true, review };
        }
        catch (error) {
            console.error('Error creating review:', error);
            return { success: false, error: error.message || 'Failed to create review' };
        }
    });
}
/**
 * Update shop rating statistics
 */
function updateShopRatingStats(shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Call the database function
            const { error } = yield dbClient.rpc('update_shop_rating_stats', {
                shop_uuid: shopId,
            });
            if (error) {
                console.error('Error updating shop rating stats:', error);
                // Fallback: calculate manually
                const { data: reviews } = yield dbClient
                    .from('reviews')
                    .select('rating')
                    .eq('shop_id', shopId)
                    .eq('status', 'published');
                if (reviews && reviews.length > 0) {
                    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    const totalReviews = reviews.length;
                    yield dbClient
                        .from('shops')
                        .update({
                        average_rating: Math.round(avgRating * 100) / 100,
                        total_reviews: totalReviews,
                    })
                        .eq('id', shopId);
                }
                else {
                    // No reviews, reset stats
                    yield dbClient
                        .from('shops')
                        .update({
                        average_rating: null,
                        total_reviews: 0,
                    })
                        .eq('id', shopId);
                }
            }
        }
        catch (error) {
            console.error('Error in updateShopRatingStats:', error);
        }
    });
}
/**
 * Get review statistics for a shop
 */
function getShopReviewStats(shopId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: reviews, error } = yield dbClient
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
            const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
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
        }
        catch (error) {
            console.error('Error getting shop review stats:', error);
            return {
                averageRating: null,
                totalReviews: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        }
    });
}
/**
 * Verify if a customer is eligible to leave a verified review
 */
function verifyReviewEligibility(bookingId, customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: booking, error } = yield dbClient
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
            const { data: existingReview } = yield dbClient
                .from('reviews')
                .select('id')
                .eq('booking_id', bookingId)
                .limit(1);
            return !existingReview || existingReview.length === 0;
        }
        catch (error) {
            console.error('Error verifying review eligibility:', error);
            return false;
        }
    });
}
