// app/components/Header.tsx
// Header - BLANK/EMPTY

"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden absolute top-4 left-4 z-[251] bg-blue-600 text-white p-2 rounded-lg"
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('openSidebarDrawer'));
          }
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              // Ensure logo click only navigates, never logs out
              e.preventDefault();
              e.stopPropagation();
              router.push("/shops");
            }}
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Yoyaku Yo
          </button>
        </div>
      </div>
    </header>
  );
}
