"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function MinimalNavbar() {
  const t = useTranslations('landing');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLoginClick = () => {
    if (typeof window !== 'undefined') {
      // Open role selection modal for login (Customer vs Owner)
      window.dispatchEvent(new CustomEvent('openLoginModal'));
    }
  };

  const handleJoinClick = () => {
    if (typeof window !== 'undefined') {
      // Open role selection modal for join
      window.dispatchEvent(new CustomEvent('openSignupModal'));
    }
  };

  const MobileDrawer = (
    <div
      className={`md:hidden fixed inset-0 z-[250] bg-blue-900 text-white transition-transform duration-300 ${
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
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="text-xl font-bold hover:text-blue-200 transition-colors"
          >
            Yoyaku Yo
          </Link>
          <button
            aria-label="Close menu"
            className="text-2xl text-gray-300 hover:text-white"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="space-y-2 flex-1">
          <li>
            <Link
              href="/browse"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-800 hover:text-white transition-colors"
            >
              <span>📂</span>
              <span>{t('navCategories') || 'Categories'}</span>
            </Link>
          </li>
          <li>
            <Link
              href="/services"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-800 hover:text-white transition-colors"
            >
              <span>🔧</span>
              <span>{t('navServices') || 'Services'}</span>
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                // Scroll to shop number search section on landing page
                if (typeof window !== 'undefined') {
                  const el = document.getElementById('shop-number-search');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    window.location.href = '/#shop-number-search';
                  }
                }
                setDrawerOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-800 hover:text-white transition-colors"
            >
              <span>🔎</span>
              <span>{t('navShopNumber') || 'Shop number'}</span>
            </button>
          </li>
          </ul>
        <div className="pt-4 border-t border-blue-700">
          <button
            onClick={() => {
              handleLoginClick();
              setDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-800 hover:text-white transition-colors mb-2"
          >
            <span>🔑</span>
            <span>{t('heroLogin') || 'Login'}</span>
          </button>
          <button
            onClick={() => {
              handleJoinClick();
              setDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <span>🚀</span>
            <span>{t('heroJoin') || 'Join'}</span>
          </button>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-[52px] left-4 z-[251] bg-blue-600 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {MobileDrawer}

      {/* Desktop navbar */}
      <nav className="sticky top-[48px] z-[150] bg-blue-900 backdrop-blur-sm border-b border-blue-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link href="/" className="text-xl font-semibold text-white hover:text-blue-200 transition-colors">
              Yoyaku Yo
            </Link>

            {/* Center: Categories | Services | Shop number - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/browse"
                className="text-sm font-medium text-white hover:text-blue-200 transition-colors"
              >
                {t('navCategories') || 'Categories'}
              </Link>
              <span className="text-blue-300">|</span>
              <Link
                href="/services"
                className="text-sm font-medium text-white hover:text-blue-200 transition-colors"
              >
                {t('navServices') || 'Services'}
              </Link>
              <span className="text-blue-300">|</span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const el = document.getElementById('shop-number-search');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.location.href = '/#shop-number-search';
                    }
                  }
                }}
                className="text-sm font-medium text-white hover:text-blue-200 transition-colors"
              >
                {t('navShopNumber') || 'Shop number 🔎'}
              </button>
            </div>

            {/* Right: Login + Join - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={handleLoginClick}
                className="px-4 py-2 text-sm font-medium text-white hover:text-blue-200 transition-colors"
              >
                {t('heroLogin') || 'Login'}
              </button>
              <button
                onClick={handleJoinClick}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-md hover:shadow-lg"
              >
                {t('heroJoin')}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

