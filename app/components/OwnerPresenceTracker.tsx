'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';

export default function OwnerPresenceTracker() {
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track presence on owner routes
    if (!pathname?.startsWith('/owner')) {
      return;
    }

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every 30 seconds
    intervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname]);

  const sendHeartbeat = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return; // Not logged in, skip heartbeat
      }

      // Send heartbeat to API
      await fetch(`${apiUrl}/analytics/presence/heartbeat`, {
        method: 'POST',
        headers: {
          'x-user-id': session.user.id,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Silently fail - presence tracking shouldn't break the app
      console.debug('Owner presence heartbeat failed:', error);
    }
  };

  // This component doesn't render anything
  return null;
}
