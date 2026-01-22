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
    // For web customers: customer_id = user.id (auth.users.id)
    // Get customer_id from customers table using auth_user_id
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("role", "web")
      .maybeSingle();
    
    if (customer?.id) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("customer_id", customer.id)
        .in("status", ["pending", "confirmed"]);
      
      const pendingCount = bookings?.length || 0;
      console.log(`[Customer Notifications] Found ${pendingCount} pending/confirmed bookings for customer_id: ${customer.id}`);
      if (pendingCount > 0) {
        console.log(`[Customer Notifications] Bookings:`, bookings?.map((b: any) => ({ id: b.id, status: b.status })));
      }
      setUnreadBookingsCount(pendingCount);
    } else {
      console.log(`[Customer Notifications] No customer record found for auth_user_id: ${user.id}`);
      setUnreadBookingsCount(0);
    }

    // Load unread messages count from conversations/messages tables (unified messaging system)
    // For web customers: customer_type = 'web', customer_ref = user.id (auth.users.id)
    // For LINE customers: customer_type = 'line', customer_ref = line_user_id
    
    // Determine customer type and ref
    let customerType: 'web' | 'line' | null = null;
    let customerRef: string | null = null;
    
    // Check if this is a LINE customer (has customer_profiles entry with line_user_id)
    if (profile?.id) {
      const { data: lineProfile } = await supabase
        .from("customer_profiles")
        .select("line_user_id")
        .eq("id", profile.id)
        .maybeSingle();
      
      if (lineProfile?.line_user_id) {
        customerType = 'line';
        customerRef = lineProfile.line_user_id;
      }
    }
    
    // If not LINE, assume web customer
    if (!customerType) {
      customerType = 'web';
      customerRef = user.id;
    }
    
    if (customerType && customerRef) {
      // Get conversations for this customer (try both web and line to be safe)
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`customer_type.eq.${customerType},customer_type.eq.web,customer_type.eq.line`)
        .eq("customer_ref", customerRef);
      
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        
        // Get unread messages from owners (not from customer)
        // Need to join with participants to filter by source = 'owner'
        const { data: unreadMessages } = await supabase
          .from("messages")
          .select(`
            id,
            participants:participants!messages_sender_id_fkey (source)
          `)
          .in("conversation_id", conversationIds)
          .eq("is_read", false);
        
        // Filter to only owner messages (participants.source = 'owner')
        const ownerUnreadCount = (unreadMessages || []).filter((msg: any) => {
          const participant = Array.isArray(msg.participants) ? msg.participants[0] : msg.participants;
          return participant?.source === 'owner';
        }).length;
        
        console.log(`[Customer Notifications] Found ${ownerUnreadCount} unread owner messages across ${conversations.length} conversations`);
        setUnreadMessagesCount(ownerUnreadCount);
      } else {
        console.log(`[Customer Notifications] No conversations found for customer_type=${customerType}, customer_ref=${customerRef}`);
        setUnreadMessagesCount(0);
      }
    } else {
      console.log(`[Customer Notifications] Missing customer type or ref: type=${customerType}, ref=${customerRef}`);
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

        // Get customer_id for bookings subscription (async)
        supabase
          .from("customers")
          .select("id")
          .eq("auth_user_id", user.id)
          .eq("role", "web")
          .maybeSingle()
          .then(({ data: customer }) => {
            if (!customer?.id) {
              console.log(`[Customer Notifications] No customer record found for bookings subscription`);
              // Still subscribe to messages (using conversations/messages tables)
              // Determine customer type for subscription
              supabase
                .from("customer_profiles")
                .select("line_user_id")
                .eq("customer_auth_id", user.id)
                .maybeSingle()
                .then(({ data: profileData }) => {
                  const customerType = profileData?.line_user_id ? 'line' : 'web';
                  const customerRef = profileData?.line_user_id || user.id;
                  
                  // Subscribe to messages table (unified messaging system)
                  const messagesChannel = supabase
                    .channel('customer-messages-realtime')
                    .on(
                      'postgres_changes',
                      {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                      },
                      async () => {
                        // Reload counts when new message is inserted
                        await loadCounts();
                      }
                    )
                    .on(
                      'postgres_changes',
                      {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                      },
                      async () => {
                        // Reload counts when message is updated (e.g., marked as read)
                        await loadCounts();
                      }
                    )
                    .subscribe();

                  subscriptionRef.current = { 
                    notificationsChannel, 
                    bookingsChannel: null,
                    messagesChannel 
                  };
                });
              return;
            }

            // Subscribe to bookings table for status changes
            const bookingsChannel = supabase
              .channel('customer-bookings-realtime')
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'bookings',
                  filter: `customer_id=eq.${customer.id}`,
                },
                async (payload: any) => {
                  const newBooking = payload.new;
                  // Check if it's a pending booking
                  if (newBooking.status === 'pending' || newBooking.status === 'confirmed') {
                    await loadCounts();
                  }
                }
              )
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'bookings',
                  filter: `customer_id=eq.${customer.id}`,
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

        // Subscribe to messages table (unified messaging system) for unread message updates
        // Determine customer type for subscription
        supabase
          .from("customer_profiles")
          .select("line_user_id")
          .eq("customer_auth_id", user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            // Subscribe to messages table (unified messaging system)
            const messagesChannel = supabase
              .channel('customer-messages-realtime')
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'messages',
                },
                async () => {
                  // Reload counts when new message is inserted
                  await loadCounts();
                }
              )
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'messages',
                },
                async () => {
                  // Reload counts when message is updated (e.g., marked as read)
                  await loadCounts();
                }
              )
              .subscribe();
            
            subscriptionRef.current = { notificationsChannel, bookingsChannel, messagesChannel };
          });
        });
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

