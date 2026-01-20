// apps/dashboard/app/components/Sidebar.tsx
// Owner dashboard sidebar navigation

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const t = useTranslations();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const openSidebarDrawer = () => setDrawerOpen(true);
    window.addEventListener('openSidebarDrawer', openSidebarDrawer);
    return () => window.removeEventListener('openSidebarDrawer', openSidebarDrawer);
  }, []);

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
      label: t('nav.analytics'),
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

  // Mobile Drawer
  const MobileDrawer = (
    <div
      className={`lg:hidden fixed inset-0 z-[60] bg-slate-900 text-white transition-transform duration-300 ${
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
          <h1 className="text-xl font-bold">Dashboard</h1>
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
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto pt-4 border-t border-slate-700">
          {user && (
            <div className="px-4 py-2 text-sm text-gray-400 mb-2 truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile drawer overlay */}
      {MobileDrawer}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
        <h1 className="text-xl font-bold text-white">Yoyaku Yo</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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

      {/* User section - always visible at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
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
