// app/components/OwnerSidebar.tsx
// Rebuilt Owner Dashboard Sidebar - EXACT structure only

"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import { useBookingNotifications } from './BookingNotificationContext';

interface Shop {
  id: string;
  name?: string;
  verification_status?: string;
}

const OwnerSidebar = React.memo(() => {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const t = useTranslations();
  const [unreadCount, setUnreadCount] = useState(0);
  const [shop, setShop] = useState<Shop | null>(null);
  const subscriptionRef = useRef<any>(null);
  const { unreadBookingsCount } = useBookingNotifications();

  // Load shop data and unread summary
  useEffect(() => {
    if (user?.id) {
      loadShop();
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

  const loadShop = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setShop(data.shops[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const loadUnreadSummary = async () => {
    try {
      const res = await fetch(`${apiUrl}/messages/owner/unread-summary`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        setUnreadCount(0);
        return;
      }
      console.error('Error loading unread summary:', error);
    }
  };

  const subscribeToUnreadUpdates = () => {
    if (!user?.id) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('unread_messages_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shop_messages',
        filter: 'sender_type=eq.customer',
      }, () => {
        loadUnreadSummary();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shop_messages',
        filter: 'read_by_owner=eq.true',
      }, () => {
        loadUnreadSummary();
      })
      .subscribe();
    subscriptionRef.current = channel;
  };

  const handleMessagesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('openMessagesPanel', { detail: {} }));
  };

  // EXACT navigation structure - NO extras
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { 
          href: '/owner/dashboard', 
          label: 'Dashboard', 
          icon: '📊',
        },
      ],
    },
    {
      title: 'SHOP SETUP',
      items: [
        { 
          href: '/owner/shop-profile', 
          label: 'Shop Profile', 
          icon: '🏪',
        },
        { 
          href: '/owner/services', 
          label: 'Services', 
          icon: '💼',
        },
        { 
          href: '/owner/availability', 
          label: 'Availability', 
          icon: '📅',
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { 
          href: '/bookings', 
          label: 'Bookings', 
          icon: '📅',
          badge: unreadBookingsCount > 0 ? unreadBookingsCount : undefined,
        },
        { 
          href: '/owner/calendar', 
          label: 'Calendar', 
          icon: '🗓️',
        },
        { 
          href: '/messages', 
          label: 'Messages', 
          icon: '💬',
          badge: unreadCount > 0 ? unreadCount : undefined,
          isPanel: true,
        },
      ],
    },
    {
      title: 'AI BOOKING ASSISTANT',
      items: [
        { 
          href: '/owner/ai-settings', 
          label: 'AI Settings', 
          icon: '🤖',
        },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { 
          href: '/owner/subscription', 
          label: 'Subscription', 
          icon: '💳',
        },
      ],
    },
  ];

  return (
    <aside className="hidden lg:block w-64 bg-slate-900 text-white fixed left-0 top-16 bottom-0 overflow-hidden">
      <nav className="p-4 flex flex-col h-full overflow-y-auto">
        <ul className="space-y-6 flex-1">
          {navSections.map((section, sectionIdx) => (
            <li key={sectionIdx}>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </div>
              <ul className="space-y-1 mt-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                  const isMessages = item.href === '/messages';
                  
                  if (isMessages && item.isPanel) {
                    return (
                      <li key={item.href}>
                        <button
                          onClick={handleMessagesClick}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative w-full text-left ${
                            isActive
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                          )}
                          <span className="text-xl">{item.icon}</span>
                          <span className={`font-medium flex-1 ${isActive ? 'font-bold' : ''}`}>
                            {item.label}
                          </span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto bg-[#3B82F6] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  }
                  
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
                        <span className={`font-medium flex-1 ${isActive ? 'font-bold' : ''}`}>
                          {item.label}
                        </span>
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
            </li>
          ))}
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
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
});

OwnerSidebar.displayName = 'OwnerSidebar';

export default OwnerSidebar;
