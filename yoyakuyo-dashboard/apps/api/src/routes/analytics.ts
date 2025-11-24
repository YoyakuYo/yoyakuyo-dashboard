// apps/api/src/routes/analytics.ts
// Analytics API routes for shop owners

import express, { Request, Response, Router } from 'express';
import { supabaseAdmin, supabase } from '../lib/supabase';
import {
  getShopOverview,
  getBookingTrends,
  getServicePopularity,
  getStaffPerformance,
  getCustomerAnalytics,
  getPeakHours,
  getCancellationRate,
} from '../services/analyticsService';

const router = Router();
const dbClient = supabaseAdmin || supabase;

// Middleware to verify shop ownership
async function verifyShopOwnership(
  req: Request,
  res: Response,
  next: Function
) {
  try {
    const userId = req.headers['x-user-id'] as string;
    const shopId = req.params.shopId || req.query.shop_id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!shopId) {
      return res.status(400).json({ error: 'shop_id is required' });
    }

    // Verify user owns the shop
    const { data: shop, error } = await dbClient
      .from('shops')
      .select('id, owner_user_id')
      .eq('id', shopId)
      .single();

    if (error || !shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (shop.owner_user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  } catch (error) {
    console.error('Error verifying shop ownership:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /analytics/shop/:shopId/overview
router.get(
  '/shop/:shopId/overview',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();

      const overview = await getShopOverview(shopId, startDate, endDate);
      return res.status(200).json(overview);
    } catch (error: any) {
      console.error('Error in GET /analytics/shop/:shopId/overview:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /analytics/shop/:shopId/bookings
router.get(
  '/shop/:shopId/bookings',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();
      const groupBy = (req.query.group_by as 'day' | 'week' | 'month') || 'day';

      const trends = await getBookingTrends(shopId, startDate, endDate, groupBy);
      return res.status(200).json(trends);
    } catch (error: any) {
      console.error('Error in GET /analytics/shop/:shopId/bookings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /analytics/shop/:shopId/services
router.get(
  '/shop/:shopId/services',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();

      const services = await getServicePopularity(shopId, startDate, endDate);
      return res.status(200).json(services);
    } catch (error: any) {
      console.error('Error in GET /analytics/shop/:shopId/services:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /analytics/shop/:shopId/staff
router.get(
  '/shop/:shopId/staff',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();

      const staff = await getStaffPerformance(shopId, startDate, endDate);
      return res.status(200).json(staff);
    } catch (error: any) {
      console.error('Error in GET /analytics/shop/:shopId/staff:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /analytics/shop/:shopId/customers
router.get(
  '/shop/:shopId/customers',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();

      const customers = await getCustomerAnalytics(shopId, startDate, endDate);
      return res.status(200).json(customers);
    } catch (error: any) {
      console.error('Error in GET /analytics/shop/:shopId/customers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /analytics/shop/:shopId/peak-hours
router.get(
  '/shop/:shopId/peak-hours',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();

      const peakHours = await getPeakHours(shopId, startDate, endDate);
      return res.status(200).json(peakHours);
    } catch (error: any) {
      console.error('Error in GET /analytics/shop/:shopId/peak-hours:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /analytics/shop/:shopId/cancellation-rate
router.get(
  '/shop/:shopId/cancellation-rate',
  verifyShopOwnership,
  async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate =
        (req.query.end_date as string) || new Date().toISOString();

      const rate = await getCancellationRate(shopId, startDate, endDate);
      return res.status(200).json({ cancellationRate: rate });
    } catch (error: any) {
      console.error(
        'Error in GET /analytics/shop/:shopId/cancellation-rate:',
        error
      );
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

