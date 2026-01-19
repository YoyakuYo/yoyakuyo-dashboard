"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { useBookingNotifications } from './BookingNotificationContext';
import { useNotifications } from '@/lib/useNotifications';
import OwnerSidebar from './OwnerSidebar';
import Header from './Header';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-[251] bg-blue-600 text-white p-2 rounded-lg"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* OwnerSidebar - Desktop sidebar only */}
      <OwnerSidebar />

      {/* Content Area - Takes remaining space like admin layout */}
      <div className="flex-1 flex flex-col">
        {/* Header - Inside content area, sticky like AdminHeader */}
        <Header />

        {/* Main Content - Flex-1, scrollable like admin layout */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile drawer - separate overlay */}
      <MobileDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
    </div>
  );
};

// Mobile drawer component
function MobileDrawer({ drawerOpen, setDrawerOpen }: { drawerOpen: boolean; setDrawerOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const t = useTranslations();
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

  // Owner navigation: put "My Shop" at the top and remove the legacy Dashboard link
  const navItems = [
    { href: '/shops', labelKey: 'nav.myShop', icon: '🏪' },
    { href: '/owner/bookings', labelKey: 'nav.bookings', icon: '📅', badge: unreadBookingsCount > 0 ? unreadBookingsCount : undefined },
    { href: '/owner/calendar', labelKey: 'nav.calendar', icon: '📆' },
    { href: '/analytics', labelKey: 'nav.analytics', icon: '📊' },
    { href: '/owner/messages', labelKey: 'nav.messages', icon: '💬', badge: unreadConversationCount > 0 ? unreadConversationCount : undefined },
    { href: '/owner/support', labelKey: 'nav.contactSupport', icon: '💬', badge: unreadSupportCount > 0 ? unreadSupportCount : undefined },
    { href: '/owner/subscription', labelKey: 'nav.subscriptions', icon: '💳' },
    { href: '/owner/settings', labelKey: 'nav.settings', icon: '⚙️' },
  ];

  const handleSignOut = async () => {
    const supabase = await import('@/lib/supabaseClient').then(m => m.getSupabaseClient());
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div
      className={`lg:hidden fixed inset-0 z-[250] bg-slate-900 text-white transition-transform duration-300 ${
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
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
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
        <div className="mt-auto pt-4 border-t border-slate-700">
          {user && (
            <div className="px-4 py-2 text-sm text-gray-400 mb-2">
              {user.email}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default OwnerLayout;