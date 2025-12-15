// apps/dashboard/lib/useBookingNotifications.ts
// Hook for subscribing to booking notifications via Supabase Realtime

"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSupabaseClient } from './supabaseClient';
import { useBookingNotifications } from '../app/components/BookingNotificationContext';
import { apiUrl } from './apiClient';

export function useBookingNotificationsHook() {
  const { user } = useAuth();
  const { setUnreadBookingsCount } = useBookingNotifications();
  const subscriptionRef = useRef<any>(null);
  const shopIdsRef = useRef<string[]>([]);

  const reloadPendingCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const supabase = getSupabaseClient();
      
      // Get shop IDs for this owner
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_user_id', user.id);
      
      if (shopsError || !shops || shops.length === 0) {
        setUnreadBookingsCount(0);
        shopIdsRef.current = [];
        return;
      }
      
      const shopIds = shops.map(s => s.id);
      shopIdsRef.current = shopIds;
      
      // Count unread notifications for owner's shops
      const { count, error: notificationsError } = await supabase
        .from('shop_notifications')
        .select('*', { count: 'exact', head: true })
        .in('shop_id', shopIds)
        .eq('is_read', false);
      
      if (notificationsError) {
        console.error('Error loading notification count:', notificationsError);
        setUnreadBookingsCount(0);
      } else {
        setUnreadBookingsCount(count || 0);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error reloading notification count:', error);
      }
      setUnreadBookingsCount(0);
    }
  }, [user?.id, setUnreadBookingsCount]);

  const subscribeToBookingUpdates = useCallback(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();

    // Subscribe to shop_notifications table for INSERT and UPDATE events
    const channel = supabase
      .channel('shop_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_notifications',
        },
        async (payload: any) => {
          const newNotification = payload.new;
          
          // Check if notification belongs to owner's shop
          if (newNotification && shopIdsRef.current.includes(newNotification.shop_id)) {
            // Reload count immediately
            await reloadPendingCount();
          } else if (shopIdsRef.current.length === 0) {
            // If shop IDs not loaded yet, reload to get them and check
            await reloadPendingCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shop_notifications',
        },
        async (payload: any) => {
          const updatedNotification = payload.new;
          const oldNotification = payload.old;

          // If is_read changed from false to true, reload count
          if (oldNotification?.is_read === false && updatedNotification?.is_read === true) {
            await reloadPendingCount();
          }
          // If is_read changed from true to false, reload count
          else if (oldNotification?.is_read === true && updatedNotification?.is_read === false) {
            await reloadPendingCount();
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  }, [user?.id, reloadPendingCount]);

  // Load initial pending bookings count and get shop IDs
  useEffect(() => {
    if (!user?.id) {
      setUnreadBookingsCount(0);
      return;
    }

    const loadPendingBookingsCount = async () => {
      // Use reloadPendingCount which queries shop_notifications
      await reloadPendingCount();
    };

    loadPendingBookingsCount();
    subscribeToBookingUpdates();

    return () => {
      if (subscriptionRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, setUnreadBookingsCount, subscribeToBookingUpdates]);
}

