// app/components/Header.tsx
// Header - BLANK/EMPTY

"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  
  // Add mobile hamburger for opening sidebar
  const handleOpenSidebar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSidebarDrawer'));
    }
  };

  return (
    <header className="lg:hidden flex items-center px-4 h-14 bg-white/95 border-b border-gray-200 shadow-sm sticky top-0 z-[201]">
      <button
        className="text-2xl text-gray-800 focus:outline-none p-2 mr-2 lg:hidden"
        aria-label="Open menu"
        onClick={handleOpenSidebar}
      >
        {/* Hamburger icon */}
        <span aria-hidden="true">☰</span>
      </button>
      <Link 
        href="/owner/shop-profile"
        className="text-lg font-bold text-japanese-charcoal hover:text-blue-600 transition-colors cursor-pointer"
        onClick={(e) => {
          // Ensure logo click only navigates, never logs out
          e.preventDefault();
          router.push("/owner/shop-profile");
        }}
      >
        Yoyaku Yo
      </Link>
    </header>
  );
}
