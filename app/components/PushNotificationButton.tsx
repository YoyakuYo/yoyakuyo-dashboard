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
        // Check permission before attempting subscription
        if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
          alert(
            'Notifications are blocked. To enable:\n\n' +
            '1. Click the lock/info icon (🔒 or ℹ️) next to the URL\n' +
            '2. Find "Notifications" and change to "Allow"\n' +
            '3. Refresh the page and try again'
          );
          setIsToggling(false);
          return;
        }
        
        const success = await subscribe(userType);
        // Error messages are already shown in the subscribe function
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      // Error messages are already shown in subscribe/unsubscribe functions
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

