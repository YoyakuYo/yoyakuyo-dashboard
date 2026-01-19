// apps/dashboard/app/components/Sidebar.tsx

"use client";
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import { useBookingNotifications } from './BookingNotificationContext';
import { useNotifications } from '@/lib/useNotifications';

const Sidebar = React.memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const t = useTranslations();
  const subscriptionRef = useRef<any>(null);
  const { unreadBookingsCount } = useBookingNotifications();
  const { notifications: ownerNotifications } = useNotifications('owner', user?.id || '');
  
  // Count unread support ticket notifications (only actual support tickets)
  const unreadSupportCount = ownerNotifications.filter(
    (n) => !n.is_read && n.type === 'new_support_ticket'
  ).length;

  // Count unread conversation messages (regular customer messages)
  const unreadConversationCount = ownerNotifications.filter(
    (n) => !n.is_read && n.type === 'new_message' && n.data?.conversation_id
  ).length;

  // Debug: Log notification counts
  console.log('[Sidebar] 🔍 [DIAGNOSTIC] ownerNotifications type:', typeof ownerNotifications);
  console.log('[Sidebar] 🔍 [DIAGNOSTIC] ownerNotifications value:', ownerNotifications);
  console.log('[Sidebar] 🔍 [DIAGNOSTIC] ownerNotifications isArray:', Array.isArray(ownerNotifications));
  console.log('[Sidebar] Notification counts:', {
    total: Array.isArray(ownerNotifications) ? ownerNotifications.length : 'NOT_ARRAY',
    unread: Array.isArray(ownerNotifications) ? ownerNotifications.filter(n => !n.is_read).length : 'NOT_ARRAY',
    supportTickets: unreadSupportCount,
    conversationMessages: unreadConversationCount,
    supportTicketDetails: Array.isArray(ownerNotifications) ? ownerNotifications.filter(n => !n.is_read && n.type === 'new_support_ticket').map(n => ({ type: n.type, title: n.title, data: n.data })) : 'NOT_ARRAY',
    conversationDetails: Array.isArray(ownerNotifications) ? ownerNotifications.filter(n => !n.is_read && n.type === 'new_message' && n.data?.conversation_id).map(n => ({ type: n.type, title: n.title, data: n.data })) : 'NOT_ARRAY'
  });

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
      const res = await fetch(`${apiUrl}/messages/owner/unread-summary`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        // API server is not running - this is expected during development
        return;
      }
      // Only log unexpected errors
      console.error('Error loading unread summary:', error);
    }
  };

  const subscribeToUnreadUpdates = () => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    
    // Subscribe to shop_messages for the owner's shops
    // We'll need to get shop IDs first, but for now, subscribe to all and filter client-side
    const channel = supabase
      .channel('unread_messages_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_messages',
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
          table: 'shop_messages',
          filter: 'read_by_owner=eq.true',
        },
        () => {
          // Reload unread summary when messages are marked as read
          loadUnreadSummary();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // Owner navigation: put "My Shop" at the top and remove the legacy Dashboard link
  const navItems = [
    { href: '/owner/shop-profile', labelKey: 'nav.myShop', icon: '🏪' },
    { href: '/owner/bookings', labelKey: 'nav.bookings', icon: '📅', badge: unreadBookingsCount > 0 ? unreadBookingsCount : undefined },
    { href: '/owner/calendar', labelKey: 'nav.calendar', icon: '📆' },
    { href: '/analytics', labelKey: 'nav.analytics', icon: '📊' },
    { href: '/owner/messages', labelKey: 'nav.messages', icon: '💬', badge: unreadConversationCount > 0 ? unreadConversationCount : undefined },
    { href: '/owner/support', labelKey: 'nav.contactSupport', icon: '💬', badge: unreadSupportCount > 0 ? unreadSupportCount : undefined },
    { href: '/owner/subscription', labelKey: 'nav.subscriptions', icon: '💳' },
    { href: '/owner/settings', labelKey: 'nav.settings', icon: '⚙️' },
  ];


  // Return only the desktop sidebar - mobile drawer handled in layout
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white min-h-screen">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">Owner Dashboard</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative cursor-pointer w-full text-left ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    onClick={() => router.push(item.href)}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                    )}
                    <span className="text-xl">{item.icon}</span>
                    <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{t(item.labelKey)}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-[#3B82F6] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-700">
          {user && (
            <div className="px-4 py-2 text-sm text-gray-400 mb-2 truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>{t('nav.logout')}</span>
          </button>
        </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

