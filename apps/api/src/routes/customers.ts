// apps/api/src/routes/customers.ts
// Customer routes for magic code lookup and customer ID management

import { Router, Request, Response } from 'express';
import { supabaseAdmin, supabase } from '../lib/supabase';
import { findCustomerByMagicCode, ensureCustomerId } from '../services/customerIdService';

const router = Router();
const dbClient = supabaseAdmin || supabase;

// ============================================
// Customer Bookings Endpoint (must be before parameterized routes)
// ============================================

// Health check for bookings endpoint
router.get('/bookings/health', async (req: Request, res: Response) => {
  return res.json({ status: 'ok', message: 'Bookings endpoint is available' });
});

// Test endpoint to verify routing is working
router.get('/test', async (req: Request, res: Response) => {
  return res.json({ 
    status: 'ok', 
    message: 'Customers router is working',
    timestamp: new Date().toISOString(),
    path: '/customers/test'
  });
});

// GET /customers/bookings - Get customer's bookings
// ONLY authenticated users (LINE and web customers) can view bookings
router.get('/bookings', async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n========== [${requestId}] GET /customers/bookings START ==========`);
  console.log(`[${requestId}] Headers:`, JSON.stringify({
    'x-user-id': req.headers['x-user-id'],
    'user-agent': req.headers['user-agent']?.substring(0, 50),
  }, null, 2));

  try {
    const userId = req.headers['x-user-id'] as string;
    console.log(`[${requestId}] Received userId:`, userId);
    
    if (!userId) {
      console.log(`[${requestId}] ❌ No userId provided`);
      return res.status(401).json({ error: 'Authentication required. Only customers with accounts can view bookings.' });
    }

    // STEP 1: Find customer.id from customers table (canonical system)
    // For WEB customers: customers.id = auth.users.id (but we no longer require auth.users)
    console.log(`[${requestId}] Looking up customer in customers table where id = ${userId}...`);
    let { data: customer, error: customerError } = await dbClient
      .from('customers')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    console.log(`[${requestId}] Customer lookup result:`, {
      customerFound: !!customer?.id,
      customerId: customer?.id,
      customerRole: customer?.role,
      error: customerError?.message,
      rawData: customer,
    });

    if (customerError) {
      console.error(`[${requestId}] ❌ Error fetching customer:`, customerError);
      return res.status(500).json({ error: 'Failed to fetch customer' });
    }

    // Auto-create customer if it doesn't exist (for web customers)
    if (!customer?.id) {
      console.log(`[${requestId}] Customer not found, creating customer record...`);
      try {
        const { data: newCustomer, error: createError } = await dbClient
          .from('customers')
          .insert({
            id: userId,
            role: 'customer'
          })
          .select('id, role')
          .single();

        if (createError || !newCustomer?.id) {
          console.error(`[${requestId}] ❌ Error creating customer:`, createError);
          return res.status(500).json({ error: 'Failed to create customer', details: createError?.message });
        }

        customer = newCustomer;
        console.log(`[${requestId}] ✅ Auto-created customer:`, customer.id);
      } catch (createErr: any) {
        console.error(`[${requestId}] ❌ Error auto-creating customer:`, createErr);
        return res.status(500).json({ error: 'Failed to create customer', details: createErr.message });
      }
    }

    const customerId = customer.id;
    console.log(`[${requestId}] ✅ Resolved customer_id:`, customerId);

    // STEP 2: Fetch bookings by customer_id ONLY (canonical system)
    // For WEB customers: bookings.customer_id = customers.id = auth.users.id
    console.log(`[${requestId}] Fetching bookings by customer_id = ${customerId}...`);
    
    const { data: bookings, error: bookingsError } = await dbClient
      .from("bookings")
      .select(`
        *,
        shops (
          id,
          name,
          address,
          phone
        ),
        services (
          id,
          name,
          price
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    console.log(`[${requestId}] Bookings query result:`, {
      queryValue: customerId,
      found: bookings?.length || 0,
      error: bookingsError?.message,
      errorCode: bookingsError?.code,
      errorDetails: bookingsError?.details,
      bookingIds: bookings?.map((b: any) => b.id) || [],
      bookingDetails: bookings?.map((b: any) => ({
        id: b.id,
        customer_id: b.customer_id,
        source: b.source,
        status: b.status,
        created_at: b.created_at,
      })) || [],
    });

    if (bookingsError) {
      console.error(`[${requestId}] ❌ Error fetching bookings:`, bookingsError);
      return res.status(500).json({ error: 'Failed to fetch bookings', details: bookingsError.message });
    }

    const allBookings = bookings || [];

    // DIAGNOSTIC: Check what bookings exist for this customer_id
    console.log(`[${requestId}] DIAGNOSTIC: Verifying bookings in database...`);
    const { data: diagnosticBookings, error: diagnosticError } = await dbClient
      .from("bookings")
      .select("id, customer_id, source, status, created_at, customer_name")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    console.log(`[${requestId}] DIAGNOSTIC: Bookings for customer_id ${customerId}:`, {
      found: diagnosticBookings?.length || 0,
      error: diagnosticError?.message,
      bookings: diagnosticBookings?.map((b: any) => ({
        id: b.id,
        customer_id: b.customer_id,
        source: b.source,
        status: b.status,
        created_at: b.created_at,
      })) || [],
    });

    // Sort by created_at descending
    allBookings.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    console.log(`[${requestId}] Final result:`, {
      totalBookings: allBookings.length,
      customerId: customerId,
      userId: userId,
      bookingIds: allBookings.map((b: any) => b.id),
      bookingStatuses: allBookings.map((b: any) => b.status),
      bookingDetails: allBookings.map((b: any) => ({
        id: b.id,
        customer_id: b.customer_id,
        source: b.source,
        status: b.status,
        shop_name: b.shops?.name,
        service_name: b.services?.name,
      })),
    });
    console.log(`========== [${requestId}] GET /customers/bookings END ==========\n`);

    return res.json({ bookings: allBookings });
  } catch (error: any) {
    console.error('Error in GET /customers/bookings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// Customer Favorites Endpoints
// ============================================

// GET /customers/favorites - Get customer's favorite shops
// ONLY authenticated users (LINE and web customers) can view favorites
router.get('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    // STRICT: Require authentication - only customers with accounts can view favorites
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Only customers with accounts can view favorites.' });
    }

    // Verify user exists in auth system
    try {
      const { data: authUser, error: authError } = await dbClient.auth.admin.getUserById(userId);
      if (authError || !authUser?.user) {
        return res.status(401).json({ error: 'Invalid user. Authentication required.' });
      }
    } catch (authCheckErr) {
      return res.status(401).json({ error: 'Authentication verification failed. Only customers with accounts can view favorites.' });
    }

    // Get customer profile by customer_auth_id
    let { data: profile, error: profileError } = await dbClient
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
      
      if (profileFallback?.id) {
        profile = profileFallback;
      } else {
        // Auto-create customer profile if it doesn't exist
        try {
          const { data: authUser } = await dbClient.auth.admin.getUserById(userId);
          const userEmail = authUser?.user?.email || '';
          const userName = authUser?.user?.user_metadata?.name || authUser?.user?.email?.split('@')[0] || 'Customer';
          
          const { data: profileId, error: createError } = await dbClient
            .rpc('create_customer_profile', {
              p_customer_auth_id: userId,
              p_email: userEmail,
              p_name: userName,
              p_phone: null
            });

          if (createError || !profileId) {
            console.error('Error creating customer profile:', createError);
            return res.status(500).json({ error: 'Failed to create customer profile' });
          }

          // Fetch the newly created profile
          const { data: newProfile } = await dbClient
            .from('customer_profiles')
            .select('id')
            .eq('id', profileId)
            .single();

          if (!newProfile?.id) {
            return res.status(500).json({ error: 'Failed to retrieve created profile' });
          }

          profile = newProfile;
        } catch (createErr: any) {
          console.error('Error auto-creating customer profile:', createErr);
          return res.status(500).json({ error: 'Failed to create customer profile', details: createErr.message });
        }
      }
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

// POST /customers/favorites - Add a shop to favorites
// ONLY authenticated users (LINE and web customers) can add favorites
router.post('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shop_id } = req.body;

    // STRICT: Require authentication - only customers with accounts can add favorites
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Only customers with accounts can add favorites.' });
    }

    // Verify user exists in auth system
    try {
      const { data: authUser, error: authError } = await dbClient.auth.admin.getUserById(userId);
      if (authError || !authUser?.user) {
        return res.status(401).json({ error: 'Invalid user. Authentication required.' });
      }
    } catch (authCheckErr) {
      return res.status(401).json({ error: 'Authentication verification failed. Only customers with accounts can add favorites.' });
    }

    if (!shop_id) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get customer profile by customer_auth_id
    let { data: profile, error: profileError } = await dbClient
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
      
      if (profileFallback?.id) {
        profile = profileFallback;
      } else {
        // Auto-create customer profile if it doesn't exist
        try {
          const { data: authUser } = await dbClient.auth.admin.getUserById(userId);
          const userEmail = authUser?.user?.email || '';
          const userName = authUser?.user?.user_metadata?.name || authUser?.user?.email?.split('@')[0] || 'Customer';
          
          const { data: profileId, error: createError } = await dbClient
            .rpc('create_customer_profile', {
              p_customer_auth_id: userId,
              p_email: userEmail,
              p_name: userName,
              p_phone: null
            });

          if (createError || !profileId) {
            console.error('Error creating customer profile:', createError);
            return res.status(500).json({ error: 'Failed to create customer profile' });
          }

          // Fetch the newly created profile
          const { data: newProfile } = await dbClient
            .from('customer_profiles')
            .select('id')
            .eq('id', profileId)
            .single();

          if (!newProfile?.id) {
            return res.status(500).json({ error: 'Failed to retrieve created profile' });
          }

          profile = newProfile;
        } catch (createErr: any) {
          console.error('Error auto-creating customer profile:', createErr);
          return res.status(500).json({ error: 'Failed to create customer profile', details: createErr.message });
        }
      }
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
// ONLY authenticated users (LINE and web customers) can remove favorites
router.delete('/favorites/:shop_id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { shop_id } = req.params;

    // STRICT: Require authentication - only customers with accounts can remove favorites
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Only customers with accounts can remove favorites.' });
    }

    // Verify user exists in auth system
    try {
      const { data: authUser, error: authError } = await dbClient.auth.admin.getUserById(userId);
      if (authError || !authUser?.user) {
        return res.status(401).json({ error: 'Invalid user. Authentication required.' });
      }
    } catch (authCheckErr) {
      return res.status(401).json({ error: 'Authentication verification failed. Only customers with accounts can remove favorites.' });
    }

    if (!shop_id) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    // Get customer profile by customer_auth_id
    let { data: profile, error: profileError } = await dbClient
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
      
      if (profileFallback?.id) {
        profile = profileFallback;
      } else {
        // Auto-create customer profile if it doesn't exist
        try {
          const { data: authUser } = await dbClient.auth.admin.getUserById(userId);
          const userEmail = authUser?.user?.email || '';
          const userName = authUser?.user?.user_metadata?.name || authUser?.user?.email?.split('@')[0] || 'Customer';
          
          const { data: profileId, error: createError } = await dbClient
            .rpc('create_customer_profile', {
              p_customer_auth_id: userId,
              p_email: userEmail,
              p_name: userName,
              p_phone: null
            });

          if (createError || !profileId) {
            console.error('Error creating customer profile:', createError);
            return res.status(500).json({ error: 'Failed to create customer profile' });
          }

          // Fetch the newly created profile
          const { data: newProfile } = await dbClient
            .from('customer_profiles')
            .select('id')
            .eq('id', profileId)
            .single();

          if (!newProfile?.id) {
            return res.status(500).json({ error: 'Failed to retrieve created profile' });
          }

          profile = newProfile;
        } catch (createErr: any) {
          console.error('Error auto-creating customer profile:', createErr);
          return res.status(500).json({ error: 'Failed to create customer profile', details: createErr.message });
        }
      }
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

