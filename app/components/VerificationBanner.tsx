// app/components/VerificationBanner.tsx
// Top blocking banner for shop verification status

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';

interface Shop {
  id: string;
  name?: string;
  verification_status?: string;
}

const VerificationBanner = React.memo(() => {
  const { user } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const verificationStatus = shop?.verification_status || 'not_submitted';
  
  // Only show banner if unverified or pending
  if (verificationStatus === 'approved') {
    return null;
  }

  const handleUploadClick = () => {
    router.push('/owner/verification');
  };

  const getBannerContent = () => {
    if (verificationStatus === 'pending') {
      return {
        message: 'Your shop verification is pending review. We will notify you once it\'s approved.',
        bgColor: 'bg-yellow-500',
        buttonText: 'View Status',
      };
    } else {
      return {
        message: 'Your shop needs to be verified before you can receive bookings. Upload your documents to get started.',
        bgColor: 'bg-red-500',
        buttonText: 'Upload Documents',
      };
    }
  };

  const content = getBannerContent();

  return (
    <div className={`${content.bgColor} text-white px-6 py-3 shadow-md`} style={{ '--banner-height': '3.75rem' } as React.CSSProperties}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-medium flex-1">{content.message}</p>
        </div>
        <button
          onClick={handleUploadClick}
          className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 font-semibold text-sm transition-colors whitespace-nowrap"
        >
          {content.buttonText}
        </button>
      </div>
    </div>
  );
});

VerificationBanner.displayName = 'VerificationBanner';

export default VerificationBanner;

