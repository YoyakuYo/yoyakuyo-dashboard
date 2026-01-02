// apps/dashboard/lib/useBookingNotifications.ts
// Hook for subscribing to booking notifications via Supabase Realtime

"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSupabaseClient } from './supabaseClient';
import { useBookingNotifications } from '@/app/components/BookingNotificationContext';
import { apiUrl } from './apiClient';

export function useBookingNotificationsHook() {
  const { user } = useAuth();
  const { setUnreadBookingsCount, setNewBookingNotification } = useBookingNotifications();
  const subscriptionRef = useRef<any>(null);
  const shopIdsRef = useRef<string[]>([]);

  const reloadPendingCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const bookingsRes = await fetch(`${apiUrl}/bookings`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const bookings = Array.isArray(bookingsData) ? bookingsData : [];
        // Count bookings with pending statuses: pending, awaiting_confirmation, reschedule_requested
        const pendingStatuses = ['pending', 'awaiting_confirmation', 'reschedule_requested'];
        const pendingCount = bookings.filter((booking: any) => 
          pendingStatuses.includes(booking.status)
        ).length;
        setUnreadBookingsCount(pendingCount);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error reloading pending bookings count:', error);
      }
      setUnreadBookingsCount(0);
    }
  }, [user?.id, setUnreadBookingsCount]);

  const subscribeToBookingUpdates = useCallback(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();

    // Subscribe to bookings table for INSERT and UPDATE events
    const channel = supabase
      .channel('booking_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload: any) => {
          const newBooking = payload.new;
          
          // Check if booking belongs to owner's shop and has a pending status
          const pendingStatuses = ['pending', 'awaiting_confirmation', 'reschedule_requested'];
          if (newBooking && pendingStatuses.includes(newBooking.status)) {
            // Check if booking belongs to owner's shop
            if (shopIdsRef.current.length > 0 && shopIdsRef.current.includes(newBooking.shop_id)) {
              // Show pop-up notification
              const supabase = getSupabaseClient();
              const { data: shopData } = await supabase
                .from('shops')
                .select('name')
                .eq('id', newBooking.shop_id)
                .single();
              
              const { data: serviceData } = await supabase
                .from('services')
                .select('name')
                .eq('id', newBooking.service_id)
                .maybeSingle();
              
              const date = newBooking.date || newBooking.booking_date || 'N/A';
              const time = newBooking.start_time 
                ? new Date(newBooking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : newBooking.time_slot || newBooking.booking_time || 'N/A';
              
              setNewBookingNotification({
                id: newBooking.id,
                customerName: newBooking.customer_name || 'Customer',
                serviceName: serviceData?.name,
                date: date,
                time: time,
                isAICreated: newBooking.is_ai_created || false,
              });
              
              // Reload count to ensure accuracy
              await reloadPendingCount();
            } else if (shopIdsRef.current.length === 0) {
              // Shop IDs not loaded yet, reload them and check again
              const shopsRes = await fetch(`${apiUrl}/shops`, {
                headers: {
                  'x-user-id': user?.id || '',
                },
              });
              if (shopsRes.ok) {
                const shopsData = await shopsRes.json();
                const shops = Array.isArray(shopsData) ? shopsData : [];
                shopIdsRef.current = shops.map((shop: any) => shop.id);
                
                if (shopIdsRef.current.includes(newBooking.shop_id)) {
                  // Show pop-up notification
                  const supabase = getSupabaseClient();
                  const { data: shopData } = await supabase
                    .from('shops')
                    .select('name')
                    .eq('id', newBooking.shop_id)
                    .single();
                  
                  const { data: serviceData } = await supabase
                    .from('services')
                    .select('name')
                    .eq('id', newBooking.service_id)
                    .maybeSingle();
                  
                  const date = newBooking.date || newBooking.booking_date || 'N/A';
                  const time = newBooking.start_time 
                    ? new Date(newBooking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : newBooking.time_slot || newBooking.booking_time || 'N/A';
                  
                  setNewBookingNotification({
                    id: newBooking.id,
                    customerName: newBooking.customer_name || 'Customer',
                    serviceName: serviceData?.name,
                    date: date,
                    time: time,
                    isAICreated: newBooking.is_ai_created || false,
                  });
                }
              }
              // Reload count to ensure accuracy
              await reloadPendingCount();
            } else {
              // Otherwise, reload count to be safe
              await reloadPendingCount();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        async (payload: any) => {
          const updatedBooking = payload.new;
          const oldBooking = payload.old;

          // If status changed from pending to something else, or vice versa, reload count
          const pendingStatuses = ['pending', 'awaiting_confirmation', 'reschedule_requested'];
          const wasPending = oldBooking?.status && pendingStatuses.includes(oldBooking.status);
          const isPending = updatedBooking?.status && pendingStatuses.includes(updatedBooking.status);
          
          if (wasPending !== isPending) {
            // Status changed between pending and non-pending, reload count
            await reloadPendingCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_type=eq.owner&recipient_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const newNotification = payload.new;
          if (newNotification && newNotification.type === 'new_booking') {
            // Show pop-up notification for new booking
            const bookingId = newNotification.data?.booking_id;
            if (bookingId) {
              // Fetch booking details
              const supabase = getSupabaseClient();
              const { data: bookingData } = await supabase
                .from('bookings')
                .select('customer_name, date, time_slot, start_time, service_id, shop_id, services(name), shops(name)')
                .eq('id', bookingId)
                .single();
              
              if (bookingData) {
                const serviceName = (bookingData.services as any)?.name;
                const date = bookingData.date || 'N/A';
                const time = bookingData.start_time 
                  ? new Date(bookingData.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : bookingData.time_slot || 'N/A';
                
                setNewBookingNotification({
                  id: bookingId,
                  customerName: bookingData.customer_name || 'Customer',
                  serviceName: serviceName,
                  date: date,
                  time: time,
                  isAICreated: true,
                });
                
                // Reload count
                await reloadPendingCount();
              }
            }
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
      try {
        // First, get shop IDs for this owner
        const shopsRes = await fetch(`${apiUrl}/shops`, {
          headers: {
            'x-user-id': user.id,
          },
        });

        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          const shops = Array.isArray(shopsData) ? shopsData : [];
          shopIdsRef.current = shops.map((shop: any) => shop.id);

          if (shopIdsRef.current.length === 0) {
            setUnreadBookingsCount(0);
            return;
          }

          // Get pending bookings count
          const bookingsRes = await fetch(`${apiUrl}/bookings`, {
            headers: {
              'x-user-id': user.id,
            },
          });

          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            const bookings = Array.isArray(bookingsData) ? bookingsData : [];
            // Count bookings with pending statuses: pending, awaiting_confirmation, reschedule_requested
            // Note: awaiting_confirmation and reschedule_requested may not exist yet, but we check for them for future compatibility
            const pendingStatuses = ['pending', 'awaiting_confirmation', 'reschedule_requested'];
            const pendingCount = bookings.filter((booking: any) => 
              pendingStatuses.includes(booking.status)
            ).length;
            setUnreadBookingsCount(pendingCount);
          }
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error('Error loading pending bookings count:', error);
        }
        setUnreadBookingsCount(0);
      }
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

