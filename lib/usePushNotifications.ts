// Hook for managing push notification subscriptions
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiUrl } from './apiClient';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    const checkSupport = async () => {
      try {
        // Check browser support
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setIsSupported(false);
          setLoading(false);
          return;
        }

        setIsSupported(true);

        // Get VAPID public key
        try {
          const res = await fetch(`${apiUrl}/api/push/vapid-key`);
          if (res.ok) {
            const data = await res.json();
            setVapidPublicKey(data.publicKey);
          } else {
            console.warn('[Push] VAPID key not available:', res.status);
          }
        } catch (error) {
          console.error('[Push] Error fetching VAPID key:', error);
        }

        // Register service worker first, then check subscription
        try {
          // Register service worker if not already registered
          let registration = await navigator.serviceWorker.getRegistration('/');
          
          if (!registration) {
            registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            });
            console.log('[Push] Service Worker registered');
          }

          // Wait for service worker to be ready (with timeout)
          const readyRegistration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<ServiceWorkerRegistration>((_, reject) => 
              setTimeout(() => reject(new Error('Service worker ready timeout')), 5000)
            )
          ]);

          // Check existing subscription
          const existingSubscription = await readyRegistration.pushManager.getSubscription();
          
          if (existingSubscription) {
            setSubscription(existingSubscription);
            setIsSubscribed(true);
          }
        } catch (error: any) {
          console.error('[Push] Error checking subscription:', error);
          // Continue even if service worker check fails
        }
      } catch (error) {
        console.error('[Push] Error in checkSupport:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[Push] Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (userType: 'owner' | 'customer') => {
    if (!isSupported || !vapidPublicKey || !user?.id) {
      console.warn('[Push] Cannot subscribe: missing requirements', { isSupported, hasKey: !!vapidPublicKey, hasUser: !!user?.id });
      return false;
    }

    try {
      // Register service worker if not already registered
      let registration: ServiceWorkerRegistration | null | undefined = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) {
          throw new Error('Service Worker registration failed');
        }
      }

      // Wait for service worker to be ready
      const readyRegistration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, reject) => 
          setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
        )
      ]);

      // Convert VAPID key to BufferSource
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const newSubscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Send subscription to backend
      const subscriptionData = {
        subscription: {
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(newSubscription.getKey('auth')!),
          },
        },
        userAgent: navigator.userAgent,
      };

      const endpoint = userType === 'owner' 
        ? '/api/push/subscribe/owner'
        : '/api/push/subscribe/customer';

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Push] Subscription API error:', res.status, errorText);
        throw new Error(`Failed to save subscription: ${res.status}`);
      }

      // Only update state after successful backend save
      setSubscription(newSubscription);
      setIsSubscribed(true);
      console.log('[Push] Successfully subscribed to push notifications');
      return true;
    } catch (error: any) {
      console.error('[Push] Subscription error:', error);
      
      // Handle permission denied
      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        alert('Please allow notifications in your browser settings to receive push notifications.');
      } else if (error.message?.includes('timeout')) {
        alert('Service worker took too long to initialize. Please refresh the page and try again.');
      } else {
        alert(`Failed to enable push notifications: ${error.message || 'Unknown error'}`);
      }
      
      return false;
    }
  }, [isSupported, vapidPublicKey, user?.id, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (userType: 'owner' | 'customer') => {
    if (!subscription || !user?.id) {
      console.warn('[Push] Cannot unsubscribe: missing subscription or user');
      return false;
    }

    try {
      // Remove from backend first
      const endpoint = userType === 'owner'
        ? '/api/push/unsubscribe/owner'
        : '/api/push/unsubscribe/customer';

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Push] Unsubscribe API error:', res.status, errorText);
        throw new Error(`Failed to remove subscription: ${res.status}`);
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      setSubscription(null);
      setIsSubscribed(false);
      console.log('[Push] Successfully unsubscribed from push notifications');
      return true;
    } catch (error: any) {
      console.error('[Push] Unsubscription error:', error);
      alert(`Failed to disable push notifications: ${error.message || 'Unknown error'}`);
      return false;
    }
  }, [subscription, user?.id]);

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}

// Helper: Convert VAPID key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// Helper: Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

