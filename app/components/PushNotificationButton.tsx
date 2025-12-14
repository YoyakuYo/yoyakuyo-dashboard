"use client";

import { useState } from 'react';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { useAuth } from '@/lib/useAuth';

interface PushNotificationButtonProps {
  userType: 'owner' | 'customer';
  className?: string;
}

export default function PushNotificationButton({ userType, className = '' }: PushNotificationButtonProps) {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);

  if (!user) {
    return null; // Don't show if not logged in
  }

  if (loading) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed ${className}`}
      >
        Loading...
      </button>
    );
  }

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Push notifications not supported in this browser
      </div>
    );
  }

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribe(userType);
      } else {
        const success = await subscribe(userType);
        if (!success) {
          alert('Failed to enable push notifications. Please check your browser settings.');
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isSubscribed
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isToggling ? (
        'Processing...'
      ) : isSubscribed ? (
        <>
          🔔 Push Notifications Enabled
        </>
      ) : (
        <>
          🔕 Enable Push Notifications
        </>
      )}
    </button>
  );
}

