"use client";

import { useState } from 'react';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';

interface PushNotificationButtonProps {
  userType: 'owner' | 'customer';
  className?: string;
}

export default function PushNotificationButton({ userType, className = '' }: PushNotificationButtonProps) {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const [isToggling, setIsToggling] = useState(false);
  const t = useTranslations();

  if (!user) {
    return null; // Don't show if not logged in
  }

  if (loading) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed ${className}`}
      >
        {t('common.loading')}
      </button>
    );
  }

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        {t('notifications.notSupported')}
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
          alert(t('notifications.blockedInstructions'));
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
        t('common.updating')
      ) : isSubscribed ? (
        <>
          🔔 {t('notifications.enabled')}
        </>
      ) : (
        <>
          🔕 {t('notifications.enable')}
        </>
      )}
    </button>
  );
}

