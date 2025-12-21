// apps/api/src/routes/reviews.ts
// Reviews and ratings API routes

import express, { Request, Response, Router } from 'express';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  createReview,
  updateShopRatingStats,
  getShopReviewStats,
  verifyReviewEligibility,
} from '../services/reviewService';

const router = Router();
const dbClient = supabaseAdmin || supabase;

// GET /reviews?shop_id=xxx - Get reviews for a shop (public, published only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const shopId = req.query.shop_id as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!shopId) {
      return res.status(400).json({ error: 'shop_id is required' });
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        'id, shop_id, booking_id, customer_id, rating, comment, photos, is_verified, owner_response, owner_response_at, status, created_at, updated_at, customers(id)'
      )
      .eq('shop_id', shopId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Mask customer info for privacy (only show if verified)
    const sanitizedReviews = (reviews || []).map((review: any) => ({
      ...review,
      customer_id: review.is_verified ? review.customer_id : null,
      customers: review.is_verified ? review.customers : null,
    }));

    return res.status(200).json(sanitizedReviews);
  } catch (error: any) {
    console.error('Error in GET /reviews:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reviews/:id - Get single review
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: review, error } = await supabase
      .from('reviews')
      .select(
        'id, shop_id, booking_id, customer_id, rating, comment, photos, is_verified, owner_response, owner_response_at, status, created_at, updated_at'
      )
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Review not found' });
      }
      console.error('Error fetching review:', error);
      return res.status(500).json({ error: 'Failed to fetch review' });
    }

    return res.status(200).json(review);
  } catch (error: any) {
    console.error('Error in GET /reviews/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reviews - Create review
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      shop_id, 
      booking_id, 
      customer_id, 
      rating, 
      comment, 
      content, // Support both comment and content
      photos,
      guest_name, // For guest reviews
    } = req.body;

    // Support both comment and content fields
    const reviewContent = content || comment;

    // Validate required fields
    if (!shop_id || !rating) {
      return res
        .status(400)
        .json({ error: 'shop_id and rating are required' });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate content length
    if (reviewContent && reviewContent.length > 2000) {
      return res
        .status(400)
        .json({ error: 'Review content must be 2000 characters or less' });
    }

    // Validate photos
    if (photos && (!Array.isArray(photos) || photos.length > 5)) {
      return res
        .status(400)
        .json({ error: 'Maximum 5 photos allowed per review' });
    }

    // PART: Resolve author identity - LINE -> USER -> GUEST
    let authorType: 'guest' | 'user' | 'line' = 'guest';
    let userId: string | null = null;
    let lineUserId: string | null = null;
    let finalGuestName: string | null = null;

    // STEP 1: Check for LINE user FIRST
    const lineUserIdFromHeader = req.headers['x-line-user-id'] as string;
    const idToken = req.headers['x-id-token'] as string;

    if (lineUserIdFromHeader && idToken) {
      console.log('[Reviews] Detected LINE user:', lineUserIdFromHeader);
      authorType = 'line';
      lineUserId = lineUserIdFromHeader;
    } 
    // STEP 2: Check for web user (x-user-id header)
    else if (req.headers['x-user-id']) {
      const webUserId = req.headers['x-user-id'] as string;
      console.log('[Reviews] Detected web user:', webUserId);
      
      // Get customer profile to get customer_id
      const { data: customerProfile } = await dbClient
        .from("customer_profiles")
        .select("id")
        .eq("customer_auth_id", webUserId)
        .maybeSingle();

      let finalCustomerId = customer_id;

      if (customerProfile?.id) {
        authorType = 'user';
        userId = webUserId;
        // Use customer_profile.id as customer_id
        finalCustomerId = customerProfile.id;
      } else {
        // Fallback: check if customer_profiles.id = user.id (old structure)
        const { data: profileFallback } = await dbClient
          .from("customer_profiles")
          .select("id")
          .eq("id", webUserId)
          .maybeSingle();
        
        if (profileFallback?.id) {
          authorType = 'user';
          userId = webUserId;
          finalCustomerId = profileFallback.id;
        } else {
          // No profile found, treat as guest
          authorType = 'guest';
          finalGuestName = guest_name || 'Guest';
        }
      }

      // Update customer_id for use in review data
      if (authorType === 'user') {
        customer_id = finalCustomerId;
      }
    } 
    // STEP 3: Guest user (no authentication)
    else {
      authorType = 'guest';
      finalGuestName = guest_name || 'Guest';
    }

    // Verify booking eligibility if booking_id provided
    if (booking_id && customer_id) {
      const eligible = await verifyReviewEligibility(booking_id, customer_id);
      if (!eligible) {
        return res.status(400).json({
          error:
            'Booking not found, not completed, or review already exists for this booking',
        });
      }
    }

    // Verify shop exists
    const { data: shop, error: shopError } = await dbClient
      .from("shops")
      .select("id")
      .eq("id", shop_id)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Create review data based on author type
    const reviewData: any = {
      shop_id,
      booking_id: booking_id || null,
      rating,
      comment: reviewContent || null,
      content: reviewContent || null, // Support both fields
      photos: photos || null,
      status: "published",
      author_type: authorType,
    };

    // Set fields based on author_type to match constraint
    if (authorType === 'line') {
      reviewData.line_user_id = lineUserId;
      reviewData.customer_id = null;
      reviewData.user_id = null;
      reviewData.guest_name = null;
    } else if (authorType === 'user') {
      reviewData.customer_id = customer_id || null;
      reviewData.user_id = userId || null;
      reviewData.line_user_id = null;
      reviewData.guest_name = null;
    } else if (authorType === 'guest') {
      reviewData.guest_name = finalGuestName;
      reviewData.customer_id = null;
      reviewData.user_id = null;
      reviewData.line_user_id = null;
    }

    console.log('[Reviews] Creating review:', {
      shop_id,
      author_type: authorType,
      user_id: userId,
      line_user_id: lineUserId,
      guest_name: finalGuestName,
    });

    const { data: newReview, error: insertError } = await dbClient
      .from("reviews")
      .insert([reviewData])
      .select()
      .single();

    if (insertError) {
      console.error("[Reviews] Error creating review:", insertError);
      return res.status(500).json({ error: "Failed to create review", details: insertError.message });
    }

    // Update shop rating stats
    await updateShopRatingStats(shop_id);

    return res.status(201).json(newReview);
      photos: photos || null,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.review);
  } catch (error: any) {
    console.error('Error in POST /reviews:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /reviews/:id - Update review (owner response or status)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { owner_response, status } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get review to check shop ownership
    const { data: review, error: reviewError } = await dbClient
      .from('reviews')
      .select('shop_id, shops!inner(owner_user_id)')
      .eq('id', id)
      .single();

    if (reviewError || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the shop
    const shop = (review as any).shops;
    if (!shop || shop.owner_user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Build update object
    const updateData: any = {};
    if (owner_response !== undefined) {
      updateData.owner_response = owner_response;
      updateData.owner_response_at = owner_response ? new Date().toISOString() : null;
    }
    if (status !== undefined) {
      if (!['pending', 'published', 'hidden', 'flagged'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: updatedReview, error: updateError } = await dbClient
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return res.status(500).json({ error: 'Failed to update review' });
    }

    // Update shop rating stats if status changed
    if (status !== undefined) {
      await updateShopRatingStats(review.shop_id);
    }

    return res.status(200).json(updatedReview);
  } catch (error: any) {
    console.error('Error in PATCH /reviews/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /reviews/:id - Soft delete review (set status to 'hidden')
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get review to check shop ownership
    const { data: review, error: reviewError } = await dbClient
      .from('reviews')
      .select('shop_id, shops!inner(owner_user_id)')
      .eq('id', id)
      .single();

    if (reviewError || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user owns the shop
    const shop = (review as any).shops;
    if (!shop || shop.owner_user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Soft delete by setting status to 'hidden'
    const { error: updateError } = await dbClient
      .from('reviews')
      .update({ status: 'hidden' })
      .eq('id', id);

    if (updateError) {
      console.error('Error deleting review:', updateError);
      return res.status(500).json({ error: 'Failed to delete review' });
    }

    // Update shop rating stats
    await updateShopRatingStats(review.shop_id);

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /reviews/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reviews/shop/:shopId/stats - Get review statistics for a shop
router.get('/shop/:shopId/stats', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;

    const stats = await getShopReviewStats(shopId);

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in GET /reviews/shop/:shopId/stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reviews/featured - Get featured/recent reviews across all shops (for landing page)
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get recent published reviews with shop and customer info
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        'id, shop_id, rating, comment, photos, is_verified, created_at, shops(id, name, category), customers(id)'
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching featured reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Sanitize customer info (only show if verified)
    const sanitizedReviews = (reviews || []).map((review: any) => ({
      id: review.id,
      shop_id: review.shop_id,
      shop_name: review.shops?.name || 'Unknown Shop',
      shop_category: review.shops?.category || null,
      rating: review.rating,
      comment: review.comment,
      photos: review.photos,
      is_verified: review.is_verified,
      created_at: review.created_at,
      customer_id: review.is_verified ? review.customer_id : null,
    }));

    return res.status(200).json(sanitizedReviews);
  } catch (error: any) {
    console.error('Error in GET /reviews/featured:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

