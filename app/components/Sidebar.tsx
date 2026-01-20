// apps/dashboard/app/components/Sidebar.tsx

"use client";
import React, { useEffect, useRef, useState } from 'react';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  useEffect(() => {
    const openSidebarDrawer = () => setDrawerOpen(true);
    window.addEventListener('openSidebarDrawer', openSidebarDrawer);
    return () => window.removeEventListener('openSidebarDrawer', openSidebarDrawer);
  }, []);


  const loadUnreadSummary = async () => {
    try {
      const res = await fetch(`${apiUrl}/messages/owner/unread-summary`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
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
    // User info and logout as navigation items
    { type: 'user', label: user?.email || '', icon: '👤', labelKey: undefined },
    { type: 'logout', labelKey: 'nav.logout', icon: '🚪', action: 'logout' },
  ];


  // Mobile Drawer
  const MobileDrawer = (
    <div
      className={`md:hidden fixed inset-0 z-[60] bg-slate-900 text-white transition-transform duration-300 ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ maxWidth: 320 }}
      onClick={() => setDrawerOpen(false)}
    >
      <nav
        className="p-4 h-full flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ height: "100vh", width: "100%" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Owner Dashboard</h1>
          <button
            aria-label="Close menu"
            className="text-2xl text-gray-400"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="space-y-1 flex-1">
          {navItems.map((item, index) => {
            // Handle special items (user info and logout)
            if (item.type === 'user') {
              return (
                <li key={`mobile-user-${index}`} className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 truncate">
                    <span className="text-lg">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                </li>
              );
            }

            if (item.type === 'logout') {
              return (
                <li key={`mobile-logout-${index}`} className="mt-2">
                  <button
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white hover:bg-red-600 hover:text-white border border-red-500"
                      onClick={() => {
                      signOut();
                      setDrawerOpen(false);
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.labelKey ? t(item.labelKey) : (item.label || '')}</span>
                  </button>
                </li>
              );
            }

            // Regular navigation items
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <button
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push(item.href);
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.labelKey ? t(item.labelKey) : (item.label || '')}</span>
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
    </div>
  );

  return (
    <>
      {/* Mobile drawer overlay */}
      {MobileDrawer}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-16 left-0 z-50 w-64 bg-slate-900 text-white h-[calc(100vh-4rem)] flex flex-col">
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <h1 className="text-xl font-bold">Owner Dashboard</h1>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <nav className="p-4 overflow-y-auto flex-1">
            <ul className="space-y-1">
            {navItems.map((item, index) => {
              // Handle special items (user info and logout)
              if (item.type === 'user') {
                return (
                  <li key={`user-${index}`} className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 truncate">
                      <span className="text-lg">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                  </li>
                );
              }

              if (item.type === 'logout') {
                return (
                  <li key={`logout-${index}`} className="mt-2">
                    <button
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer w-full text-left text-white hover:bg-red-600 hover:text-white border border-red-500"
                      onClick={signOut}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.labelKey ? t(item.labelKey) : (item.label || '')}</span>
                    </button>
                  </li>
                );
              }

              // Regular navigation items
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
                    <span className={`font-medium ${isActive ? 'font-bold' : ''}`}>{item.labelKey ? t(item.labelKey) : (item.label || '')}</span>
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
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

