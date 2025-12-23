// apps/api/src/routes/owner.ts
// Owner routes for standalone API

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// GET /owner/bookings - Get all bookings for owner's shops
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const userId = req.headers['x-user-id'] as string;
    console.log('[Owner Bookings] Request for userId:', userId);

    if (!userId) {
      console.log('[Owner Bookings] No userId in headers');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all shops owned by this user
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from('shops')
      .select('id, name')
      .eq('owner_user_id', userId);

    console.log('[Owner Bookings] Shops query result:', { shops, shopsError });

    if (shopsError) {
      console.error('Error fetching shops for owner:', shopsError);
      return res.status(500).json({ error: 'Failed to fetch shops' });
    }

    if (!shops || shops.length === 0) {
      console.log('[Owner Bookings] No shops found for user');
      return res.json([]);
    }

    const shopIds = shops.map(shop => shop.id);
    console.log('[Owner Bookings] Shop IDs to query:', shopIds);

    // Get all bookings for these shops with service information
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        shop_id,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        start_time,
        end_time,
        status,
        created_at,
        notes,
        services(name)
      `)
      .in('shop_id', shopIds)
      .order('created_at', { ascending: false });

    console.log('[Owner Bookings] Bookings query result:', { count: bookings?.length, bookingsError });

    if (bookingsError) {
      console.error('Error fetching bookings for owner:', bookingsError);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    // Add shop name to each booking
    const bookingsWithShopNames = bookings?.map(booking => {
      const shop = shops.find(s => s.id === booking.shop_id);
      return {
        ...booking,
        shop_name: shop?.name || 'Unknown Shop'
      };
    }) || [];

    console.log('[Owner Bookings] Final response:', bookingsWithShopNames.length, 'bookings');
    res.json(bookingsWithShopNames);
  } catch (error: any) {
    console.error('Error in owner bookings:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
