// apps/api/src/routes/customers.ts
// Customer routes for magic code lookup and customer ID management

import { Router, Request, Response } from 'express';
import { supabaseAdmin, supabase } from '../lib/supabase';
import { findCustomerByMagicCode, ensureCustomerId } from '../services/customerIdService';

const router = Router();
const dbClient = supabaseAdmin || supabase;

// GET /customers/magic/:magicCode - Find customer by magic code
router.get('/magic/:magicCode', async (req: Request, res: Response) => {
  try {
    const { magicCode } = req.params;

    if (!magicCode) {
      return res.status(400).json({ error: 'Magic code is required' });
    }

    const customer = await findCustomerByMagicCode(magicCode);

    if (!customer.customerId) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Find or create thread for this customer
    // Get the first shop thread for this customer
    const { data: thread } = await dbClient
      .from('shop_threads')
      .select('id, shop_id')
      .eq('customer_id', customer.customerId) // Use customer_id instead of email
      .limit(1)
      .single();

    return res.json({
      ...customer,
      threadId: thread?.id || null,
      shopId: thread?.shop_id || null,
    });
  } catch (error: any) {
    console.error('Error finding customer by magic code:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /customers/:id/ensure-id - Ensure customer has ID and magic code
router.post('/:id/ensure-id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = await ensureCustomerId(id, name);

    return res.json(result);
  } catch (error: any) {
    console.error('Error ensuring customer ID:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /customers/:id/push-subscription - Save customer push subscription (safe - optional feature)
router.post('/:id/push-subscription', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subscription, userAgent } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Safe: Import dynamically to avoid breaking if web-push isn't set up
    const { saveCustomerPushSubscription } = require('../services/webPushService');
    const success = await saveCustomerPushSubscription(id, subscription, userAgent);

    if (success) {
      return res.json({ success: true });
    } else {
      // Safe: Return success even if subscription save failed (non-critical feature)
      return res.json({ 
        success: false, 
        message: 'Push notifications not configured. Subscription saved but notifications disabled.' 
      });
    }
  } catch (error: any) {
    // Safe: Don't break the API if push subscriptions fail
    console.error('Error saving push subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to save subscription',
      message: error.message 
    });
  }
});

// ============================================
// Customer Favorites Endpoints
// ============================================

// GET /customers/favorites - Get customer's favorite shops
router.get('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get customer profile by customer_auth_id
    const { data: profile, error: profileError } = await dbClient
      .from('customer_profiles')
      .select('id')
      .eq('customer_auth_id', userId)
      .maybeSingle();

    if (profileError || !profile?.id) {
      // Try fallback: check if customer_profiles.id = user.id (old structure)
      const { data: profileFallback } = await dbClient
        .from('customer_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profileFallback?.id) {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
      
      // Use fallback profile
      const { data: favorites, error: favoritesError } = await dbClient
        .from('customer_favorites')
        .select(`
          *,
          shops (
            id,
            name,
            address,
            phone,
            description,
            category,
            main_image_url,
            rating,
            review_count
          )
        `)
        .eq('customer_id', profileFallback.id)
        .order('created_at', { ascending: false });

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        return res.status(500).json({ error: 'Failed to fetch favorites' });
      }

      return res.json({ favorites: favorites || [] });
    }

    // Get favorites for this customer profile
    const { data: favorites, error: favoritesError } = await dbClient
      .from('customer_favorites')
      .select(`
        *,
        shops (
          id,
          name,
          address,
          phone,
          description,
          category,
          main_image_url,
          rating,
          review_count
        )
      `)
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }

    return res.json({ favorites: favorites || [] });
  } catch (error: any) {
    console.error('Error in GET /customers/favorites:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /customers/favorites - Add a shop to favorites
router.post('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shop_id } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!shop_id) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get customer profile by customer_auth_id
    const { data: profile, error: profileError } = await dbClient
      .from('customer_profiles')
      .select('id')
      .eq('customer_auth_id', userId)
      .maybeSingle();

    if (profileError || !profile?.id) {
      // Try fallback: check if customer_profiles.id = user.id (old structure)
      const { data: profileFallback } = await dbClient
        .from('customer_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profileFallback?.id) {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
      
      // Insert favorite using fallback profile
      const { data: favorite, error: insertError } = await dbClient
        .from('customer_favorites')
        .insert({
          customer_id: profileFallback.id,
          shop_id: shop_id,
        })
        .select()
        .single();

      if (insertError) {
        // Check if it's a duplicate (unique constraint violation)
        if (insertError.code === '23505') {
          return res.status(409).json({ error: 'Shop is already in favorites' });
        }
        console.error('Error adding favorite:', insertError);
        return res.status(500).json({ error: 'Failed to add favorite' });
      }

      return res.json({ favorite });
    }

    // Insert favorite
    const { data: favorite, error: insertError } = await dbClient
      .from('customer_favorites')
      .insert({
        customer_id: profile.id,
        shop_id: shop_id,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate (unique constraint violation)
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Shop is already in favorites' });
      }
      console.error('Error adding favorite:', insertError);
      return res.status(500).json({ error: 'Failed to add favorite' });
    }

    return res.json({ favorite });
  } catch (error: any) {
    console.error('Error in POST /customers/favorites:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /customers/favorites/:shop_id - Remove a shop from favorites
router.delete('/favorites/:shop_id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shop_id } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!shop_id) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get customer profile by customer_auth_id
    const { data: profile, error: profileError } = await dbClient
      .from('customer_profiles')
      .select('id')
      .eq('customer_auth_id', userId)
      .maybeSingle();

    if (profileError || !profile?.id) {
      // Try fallback: check if customer_profiles.id = user.id (old structure)
      const { data: profileFallback } = await dbClient
        .from('customer_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profileFallback?.id) {
        return res.status(404).json({ error: 'Customer profile not found' });
      }
      
      // Delete favorite using fallback profile
      const { error: deleteError } = await dbClient
        .from('customer_favorites')
        .delete()
        .eq('customer_id', profileFallback.id)
        .eq('shop_id', shop_id);

      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        return res.status(500).json({ error: 'Failed to remove favorite' });
      }

      return res.json({ success: true });
    }

    // Delete favorite
    const { error: deleteError } = await dbClient
      .from('customer_favorites')
      .delete()
      .eq('customer_id', profile.id)
      .eq('shop_id', shop_id);

    if (deleteError) {
      console.error('Error removing favorite:', deleteError);
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /customers/favorites/:shop_id:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

