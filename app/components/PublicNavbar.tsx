// apps/dashboard/app/components/PublicNavbar.tsx
// Unified public navbar for all public pages

"use client";

import Link from 'next/link';

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Clickable Logo */}
          <Link 
            href="/" 
            className="text-xl font-semibold text-japanese-charcoal hover:text-japanese-red transition-colors"
          >
            Yoyaku Yo
          </Link>
        </div>
      </div>
    </nav>
  );
}
