'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    trackPageView(pathname);
  }, [pathname]);

  const trackPageView = async (pageUrl: string) => {
    try {
      // Generate or get session ID from localStorage
      let sessionId = localStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_session_id', sessionId);
      }

      // Track the page view
      await fetch(`${apiUrl}/admin/analytics/visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          pageUrl: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Silently fail - visitor tracking shouldn't break the app
      console.debug('Visitor tracking failed:', error);
    }
  };

  // This component doesn't render anything
  return null;
}