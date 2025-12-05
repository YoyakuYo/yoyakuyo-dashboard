// app/components/OwnerSidebar.tsx
// Reorganized owner dashboard sidebar with sections

"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import { useBookingNotifications } from './BookingNotificationContext';
import NotificationDot from './NotificationDot';

interface Shop {
  id: string;
  verification_status?: string;
  subscription_plan?: string;
  booking_enabled?: boolean;
  ai_enabled?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  requiresVerification: boolean;
  requiresSubscription?: boolean | 'pro';
  badge?: number;
  isPanel?: boolean;
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

  // Check if feature is enabled
  const isBookingEnabled = shop?.booking_enabled ?? false;
  const isAiEnabled = shop?.ai_enabled ?? false;
  const isVerified = shop?.verification_status === 'approved';
  const subscriptionPlan = shop?.subscription_plan || 'free';

  // Navigation sections
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { 
          href: '/owner/dashboard', 
          label: 'Dashboard', 
          icon: '📊',
          requiresVerification: false,
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
          requiresVerification: false,
        },
        { 
          href: '/owner/owner-profile', 
          label: 'Owner Profile', 
          icon: '👤',
          requiresVerification: false,
        },
        { 
          href: '/owner/verification', 
          label: 'Verification & Documents', 
          icon: '✅',
          requiresVerification: false,
        },
      ],
    },
    {
      title: 'SERVICES & PRICING',
      items: [
        { 
          href: '/owner/services', 
          label: 'Services', 
          icon: '💼',
          requiresVerification: false,
        },
        { 
          href: '/owner/pricing', 
          label: 'Pricing', 
          icon: '💰',
          requiresVerification: false,
        },
        { 
          href: '/owner/availability', 
          label: 'Availability & Schedule', 
          icon: '📅',
          requiresVerification: false,
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
          requiresVerification: true,
          requiresSubscription: true,
        },
        { 
          href: '/owner/calendar', 
          label: 'Calendar', 
          icon: '🗓️',
          requiresVerification: true,
          requiresSubscription: true,
        },
        { 
          href: '/messages', 
          label: 'Messages', 
          icon: '💬', 
          badge: unreadCount > 0 ? unreadCount : undefined, 
          isPanel: true,
          requiresVerification: false,
        },
      ],
    },
    {
      title: 'AI & AUTOMATION',
      items: [
        { 
          href: '/assistant', 
          label: 'AI Assistant', 
          icon: '🤖',
          requiresVerification: true,
          requiresSubscription: 'pro',
        },
        { 
          href: '/owner/automation', 
          label: 'Automation Rules', 
          icon: '⚙️',
          requiresVerification: true,
          requiresSubscription: 'pro',
        },
      ],
    },
    {
      title: 'BUSINESS & BILLING',
      items: [
        { 
          href: '/owner/subscription', 
          label: 'Subscription', 
          icon: '💳',
          requiresVerification: false,
        },
        { 
          href: '/owner/staff', 
          label: 'Staff & Roles', 
          icon: '👥',
          requiresVerification: false,
        },
        { 
          href: '/owner/payouts', 
          label: 'Payouts', 
          icon: '💵',
          requiresVerification: false,
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { 
          href: '/settings', 
          label: 'Settings', 
          icon: '⚙️',
          requiresVerification: false,
        },
      ],
    },
  ];

  const isItemDisabled = (item: NavItem) => {
    if (item.requiresVerification && !isVerified) return true;
    if (item.requiresSubscription === true && subscriptionPlan === 'free') return true;
    if (item.requiresSubscription === 'pro' && subscriptionPlan !== 'pro') return true;
    return false;
  };

  return (
    <aside className="hidden lg:block w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 pt-16">
      <nav className="p-4 flex flex-col h-full overflow-y-auto">
        <ul className="space-y-6 flex-1">
          {navSections.map((section, sectionIdx) => (
            <li key={sectionIdx}>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </div>
              <ul className="space-y-1 mt-2">
                {section.items.map((item) => {
                  const navItem = item as NavItem;
                  const isActive = pathname === navItem.href || (navItem.href !== '/' && pathname?.startsWith(navItem.href));
                  const isDisabled = isItemDisabled(navItem);
                  const isMessages = navItem.href === '/messages';
                  
                  if (isMessages && navItem.isPanel) {
                    return (
                      <li key={navItem.href}>
                        <button
                          onClick={handleMessagesClick}
                          disabled={isDisabled}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative w-full text-left ${
                            isActive
                              ? 'bg-blue-600 text-white font-bold'
                              : isDisabled
                              ? 'text-gray-500 cursor-not-allowed opacity-50'
                              : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                          )}
                          <span className="text-xl">{navItem.icon}</span>
                          <span className={`font-medium flex-1 ${isActive ? 'font-bold' : ''}`}>
                            {navItem.label}
                          </span>
                          {navItem.badge !== undefined && navItem.badge > 0 && (
                            <span className="ml-auto bg-[#3B82F6] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {navItem.badge}
                            </span>
                          )}
                          {isDisabled && (
                            <span className="ml-auto text-xs text-gray-500">🔒</span>
                          )}
                        </button>
                      </li>
                    );
                  }
                  
                  return (
                    <li key={navItem.href}>
                      <Link
                        href={isDisabled ? '#' : navItem.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold'
                            : isDisabled
                            ? 'text-gray-500 cursor-not-allowed opacity-50'
                            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r"></span>
                        )}
                        <span className="text-xl">{navItem.icon}</span>
                        <span className={`font-medium flex-1 ${isActive ? 'font-bold' : ''}`}>
                          {navItem.label}
                        </span>
                        {navItem.badge !== undefined && navItem.badge > 0 && (
                          <span className="ml-auto bg-[#3B82F6] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {navItem.badge}
                          </span>
                        )}
                        {isDisabled && (
                          <span className="ml-auto text-xs text-gray-500">🔒</span>
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
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </nav>
    </aside>
  );
});

OwnerSidebar.displayName = 'OwnerSidebar';

export default OwnerSidebar;

