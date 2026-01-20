// app/components/Header.tsx
// Header - BLANK/EMPTY

"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  const handleOpenSidebar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSidebarDrawer'));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
      {/* Mobile Header */}
      <div className="flex md:hidden items-center h-full px-4">
        <button
          className="text-2xl text-gray-800 focus:outline-none p-2 mr-2"
          aria-label="Open menu"
          onClick={handleOpenSidebar}
        >
          ☰
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push("/owner/shop-profile");
          }}
          className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          Yoyaku Yo
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center h-full px-6">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push("/owner/shop-profile");
          }}
          className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          Yoyaku Yo
        </button>
      </div>
    </header>
  );
}
