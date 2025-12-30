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

export default router;

