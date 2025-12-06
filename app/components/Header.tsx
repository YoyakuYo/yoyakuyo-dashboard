// app/components/Header.tsx
// Owner Dashboard Header with Shop Name and Verification Badge

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';
import { LanguageSwitcher } from './LanguageSwitcher';

interface Shop {
  id: string;
  name?: string;
  verification_status?: string;
}

const Header = React.memo(() => {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadShop();
    }
  }, [user]);

  const loadShop = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setShop(data.shops[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const getVerificationBadge = () => {
    const status = shop?.verification_status || 'not_submitted';
    
    if (status === 'approved') {
      return (
        <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
          Verified
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
          Pending
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
          Unverified
        </span>
      );
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-50">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {shop?.name || 'My Shop'}
          </h1>
          {getVerificationBadge()}
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
