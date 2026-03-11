// app/components/Header.tsx
// Header - BLANK/EMPTY

"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-6 w-full">
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
        <a
          href="#install-app"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("install-app-banner")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          📱 Install app
        </a>
      </div>
    </header>
  );
}
