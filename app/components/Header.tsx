// app/components/Header.tsx
// Header - BLANK/EMPTY

"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 px-6 z-40">
      <button
        onClick={(e) => {
          // Ensure logo click only navigates, never logs out
          e.preventDefault();
          e.stopPropagation();
          router.push("/owner/shop-profile");
        }}
        className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        Yoyaku Yo
      </button>
    </header>
  );
}
