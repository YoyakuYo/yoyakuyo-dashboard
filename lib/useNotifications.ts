"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from './supabaseClient';
import { apiUrl } from './apiClient';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  recipient_type: 'owner' | 'customer';
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userType: 'owner' | 'customer', userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);
  const actualRecipientIdRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      // For customers, we need to get the actual auth ID to send to API
      let authUserId = userId;
      
      if (userType === 'customer') {
        // userId is customer_profile_id, but API needs customer_auth_id
        const supabase = getSupabaseClient();
        const { data: profile } = await supabase
          .from("customer_profiles")
          .select("customer_auth_id")
          .eq("id", userId)
          .single();
        
        if (profile?.customer_auth_id) {
          authUserId = profile.customer_auth_id;
          actualRecipientIdRef.current = userId; // Store the profile ID for real-time subscription
        } else {
          setLoading(false);
          return;
        }
      } else {
        actualRecipientIdRef.current = userId;
      }

      const res = await fetch(`${apiUrl}/notifications?recipient_type=${userType}`, {
        headers: {
          'x-user-id': authUserId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedNotifications = Array.isArray(data) ? data : [];
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userType]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // For customers, get auth ID
      let authUserId = userId;
      if (userType === 'customer') {
        const supabase = getSupabaseClient();
        const { data: profile } = await supabase
          .from("customer_profiles")
          .select("customer_auth_id")
          .eq("id", userId)
          .single();
        
        if (profile?.customer_auth_id) {
          authUserId = profile.customer_auth_id;
        } else {
          return;
        }
      }

      const res = await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': authUserId,
        },
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userId, userType]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    // Get the actual recipient ID for real-time subscription
    const setupSubscription = async () => {
      let recipientId = userId;

      if (userType === 'customer') {
        // For customers, userId is already customer_profile_id (passed from CustomerHeader)
        recipientId = userId;
        actualRecipientIdRef.current = userId;
      } else {
        actualRecipientIdRef.current = userId;
      }

      // Subscribe to new notifications
      const channel = supabase
        .channel(`notifications_realtime_${userType}_${recipientId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_type=eq.${userType}&recipient_id=eq.${recipientId}`,
          },
          (payload: any) => {
            const newNotification = payload.new as Notification;
            
            // Add to notifications list
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast notification
            toast.success(
              `${newNotification.title}\n${newNotification.body}`,
              {
                duration: 5000,
                icon: '🔔',
              }
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_type=eq.${userType}&recipient_id=eq.${recipientId}`,
          },
          (payload: any) => {
            const updatedNotification = payload.new as Notification;
            
            // Update in notifications list
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
            
            // Update unread count
            if (updatedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    };

    setupSubscription();

    // Initial fetch
    fetchNotifications();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, userType, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refreshNotifications,
  };
}

