// lib/useCustomerNotifications.ts
// Hook for subscribing to customer booking notifications via Supabase Realtime

"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useCustomAuth } from './useCustomAuth';
import { getSupabaseClient } from './supabaseClient';
import { useCustomerNotifications } from '@/app/customer/components/CustomerNotificationContext';

export function useCustomerNotificationsHook() {
  const { user } = useCustomAuth();
  const { 
    setUnreadNotificationsCount, 
    setUnreadBookingsCount,
    setUnreadMessagesCount,
    setNewNotification 
  } = useCustomerNotifications();
  const subscriptionRef = useRef<any>(null);
  const profileIdRef = useRef<string | null>(null);

  const loadCounts = useCallback(async () => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    
    // Get customer_profile_id from customer_auth_id
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", user.id)
      .maybeSingle();

    if (!profile?.id) return;
    profileIdRef.current = profile.id;

    // Load unread notifications count
    const { data: notifications } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("recipient_type", "customer")
      .eq("recipient_id", profile.id)
      .eq("is_read", false);
    
    setUnreadNotificationsCount(notifications?.length || 0);

    // Load bookings with pending/confirmed status (unread bookings)
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_profile_id", profile.id)
      .in("status", ["pending", "confirmed"]);
    
    setUnreadBookingsCount(bookings?.length || 0);

    // Load unread messages count (messages from owner not read by customer)
    const { data: threads } = await supabase
      .from("shop_threads")
      .select("id")
      .eq("customer_id", profile.id);
    
    if (threads && threads.length > 0) {
      const threadIds = threads.map(t => t.id);
      const { data: unreadMessages } = await supabase
        .from("shop_messages")
        .select("id")
        .in("thread_id", threadIds)
        .eq("read_by_customer", false)
        .eq("sender_type", "owner");
      
      setUnreadMessagesCount(unreadMessages?.length || 0);
    } else {
      setUnreadMessagesCount(0);
    }
  }, [user?.id, setUnreadNotificationsCount, setUnreadBookingsCount, setUnreadMessagesCount]);

  const subscribeToUpdates = useCallback(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    
    // Get customer_profile_id first
    supabase
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!profile?.id) return;
        profileIdRef.current = profile.id;

        // Subscribe to notifications table
        const notificationsChannel = supabase
          .channel('customer-notifications-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_type=eq.customer&recipient_id=eq.${profile.id}`,
            },
            async (payload: any) => {
              const newNotification = payload.new;
              // Reload counts
              await loadCounts();
              // Show pop-up notification
              setNewNotification({
                id: newNotification.id,
                title: newNotification.title || 'Notification',
                body: newNotification.body || '',
                bookingId: newNotification.data?.booking_id,
                status: newNotification.data?.status,
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `recipient_type=eq.customer&recipient_id=eq.${profile.id}`,
            },
            () => {
              loadCounts();
            }
          )
          .subscribe();

        // Subscribe to bookings table for status changes
        const bookingsChannel = supabase
          .channel('customer-bookings-realtime')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'bookings',
              filter: `customer_profile_id=eq.${profile.id}`,
            },
            async (payload: any) => {
              const updatedBooking = payload.new;
              const oldBooking = payload.old;
              
              // Check if status changed to confirmed, cancelled, or completed
              const statusChanges = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['completed', 'cancelled'],
              };
              
              const oldStatus = oldBooking?.status;
              const newStatus = updatedBooking?.status;
              
              if (oldStatus && newStatus && oldStatus !== newStatus) {
                // Reload counts
                await loadCounts();
                
                // Show pop-up notification for status changes
                if (['confirmed', 'cancelled', 'completed'].includes(newStatus)) {
                  const { data: shopData } = await supabase
                    .from('shops')
                    .select('name')
                    .eq('id', updatedBooking.shop_id)
                    .maybeSingle();
                  
                  const { data: serviceData } = await supabase
                    .from('services')
                    .select('name')
                    .eq('id', updatedBooking.service_id)
                    .maybeSingle();
                  
                  const date = updatedBooking.date || updatedBooking.booking_date || 'N/A';
                  const time = updatedBooking.start_time 
                    ? new Date(updatedBooking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : updatedBooking.time_slot || updatedBooking.booking_time || 'N/A';
                  
                  let title = '';
                  let body = '';
                  
                  if (newStatus === 'confirmed') {
                    title = 'Booking Confirmed';
                    body = `Your booking for ${serviceData?.name || 'service'} at ${shopData?.name || 'the shop'} on ${date} at ${time} has been confirmed!`;
                  } else if (newStatus === 'cancelled') {
                    title = 'Booking Cancelled';
                    body = `Your booking for ${serviceData?.name || 'service'} at ${shopData?.name || 'the shop'} on ${date} has been cancelled.`;
                  } else if (newStatus === 'completed') {
                    title = 'Booking Completed';
                    body = `Your booking for ${serviceData?.name || 'service'} at ${shopData?.name || 'the shop'} on ${date} has been completed.`;
                  }
                  
                  if (title && body) {
                    setNewNotification({
                      id: updatedBooking.id,
                      title,
                      body,
                      bookingId: updatedBooking.id,
                      status: newStatus,
                    });
                  }
                }
              }
            }
          )
          .subscribe();

        // Subscribe to messages table for unread message updates
        const messagesChannel = supabase
          .channel('customer-messages-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'shop_messages',
              filter: `sender_type=eq.owner`,
            },
            () => {
              loadCounts();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'shop_messages',
              filter: `read_by_customer=eq.true`,
            },
            () => {
              loadCounts();
            }
          )
          .subscribe();

        subscriptionRef.current = { notificationsChannel, bookingsChannel, messagesChannel };
      });
  }, [user?.id, loadCounts, setNewNotification]);

  // Load initial counts and subscribe
  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationsCount(0);
      setUnreadBookingsCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    loadCounts();
    subscribeToUpdates();

    return () => {
      if (subscriptionRef.current) {
        const supabase = getSupabaseClient();
        if (subscriptionRef.current.notificationsChannel) {
          supabase.removeChannel(subscriptionRef.current.notificationsChannel);
        }
        if (subscriptionRef.current.bookingsChannel) {
          supabase.removeChannel(subscriptionRef.current.bookingsChannel);
        }
        if (subscriptionRef.current.messagesChannel) {
          supabase.removeChannel(subscriptionRef.current.messagesChannel);
        }
      }
    };
  }, [user, loadCounts, subscribeToUpdates, setUnreadNotificationsCount, setUnreadBookingsCount, setUnreadMessagesCount]);
}

