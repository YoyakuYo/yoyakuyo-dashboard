// apps/dashboard/app/components/Sidebar.tsx

"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import { useBookingNotifications } from './BookingNotificationContext';

const Sidebar = React.memo(() => {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const t = useTranslations();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);
  const { unreadBookingsCount } = useBookingNotifications();

  // Load unread summary on mount
  useEffect(() => {
    if (user?.id) {
      loadUnreadSummary();
      subscribeToUnreadUpdates();
    }

    return () => {
      if (subscriptionRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user]);

  const loadUnreadSummary = async () => {
    try {
      // PART 4: Use new internal messaging endpoint
      const res = await fetch(`${apiUrl}/api/internal-messaging/owner/unread-count`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        // API server is not running - this is expected during development
        setUnreadCount(0);
        return;
      }
      // Only log unexpected errors
      console.error('Error loading unread summary:', error);
    }
  };

  const subscribeToUnreadUpdates = () => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    
    // PART 4: Subscribe to messages table for the owner's shops
    const channel = supabase
      .channel('unread_messages_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'sender_type=eq.customer',
        },
        () => {
          // Reload unread summary when new customer message arrives
          loadUnreadSummary();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: 'is_read=eq.true',
        },
        () => {
          // Reload unread summary when messages are marked as read
          loadUnreadSummary();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const navItems = [
    { href: '/shops', label: t('nav.myShop'), icon: '🏪' },
    { href: '/analytics', label: t('analytics.title'), icon: '📊' },
    { href: '/assistant', label: t('nav.aiAssistant'), icon: '🤖', badge: unreadCount > 0 ? unreadCount : undefined },
    { href: '/bookings', label: t('nav.bookings'), icon: '📅', badge: unreadBookingsCount > 0 ? unreadBookingsCount : undefined },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="hidden lg:block w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 pt-16">
      <nav className="p-4 flex flex-col h-full">
        <ul className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                  )}
                  <span className="text-xl">{item.icon}</span>
                  <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-[#3B82F6] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* User info and logout */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          {user && (
            <div className="px-4 py-2 mb-2">
              <p className="text-sm text-gray-400 truncate" title={user.email || undefined}>
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </nav>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

