// apps/dashboard/app/components/Sidebar.tsx
// Owner dashboard sidebar navigation

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const t = useTranslations();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navItems = [
    {
      href: '/shops',
      label: t('nav.myShop'),
      icon: '🏪',
    },
    {
      href: '/owner/analytics',
      label: 'Analytics',
      icon: '📈',
    },
    {
      href: '/assistant',
      label: t('nav.aiAssistant'),
      icon: '🤖',
    },
    {
      href: '/settings',
      label: t('nav.settings'),
      icon: '⚙️',
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Yoyaku Yo</h1>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User section - always visible at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        {user && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors border border-red-200"
        >
          <span className="mr-3">🚪</span>
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
