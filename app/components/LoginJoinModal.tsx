// apps/dashboard/app/components/LoginJoinModal.tsx
// Unified Login/Join modal with two columns (Customers/Owners)

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Compact QR Code component for modal
function ModalQRCode() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [lineUrl, setLineUrl] = useState<string | null>(null);

  useEffect(() => {
    const lineOfficialAccountId = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!lineOfficialAccountId && !liffId) {
      return;
    }

    let qrUrl: string;

    if (lineOfficialAccountId) {
      qrUrl = `https://line.me/R/ti/p/@${lineOfficialAccountId.replace('@', '')}`;
    } else if (liffId) {
      qrUrl = `https://liff.line.me/${liffId}?entry=qr`;
    } else {
      return;
    }

    setLineUrl(qrUrl);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`;
    setQrCodeUrl(qrCodeImageUrl);
  }, []);

  const handleCopyLink = () => {
    if (lineUrl) {
      navigator.clipboard.writeText(lineUrl);
      alert('LINE link copied to clipboard!');
    }
  };

  if (!qrCodeUrl) {
    return (
      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
        <img
          src={qrCodeUrl}
          alt="LINE QR Code"
          className="w-24 h-24"
        />
      </div>
      <p className="text-xs text-gray-600 mb-1">Scan to join LINE</p>
      {lineUrl && (
        <button
          onClick={handleCopyLink}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          Copy link
        </button>
      )}
    </div>
  );
}

export default function LoginJoinModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'join'>('login');

  let t: ReturnType<typeof useTranslations>;
  let tAuth: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tAuth = useTranslations('auth');
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      setMode(e.detail?.mode || 'login');
      setIsOpen(true);
    };

    window.addEventListener('openLoginJoinModal', handleOpen as EventListener);

    return () => {
      window.removeEventListener('openLoginJoinModal', handleOpen as EventListener);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
      onClick={() => setIsOpen(false)}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Choose Your Path
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: For Customers - Join through LINE */}
          <div className="border-r border-gray-200 pr-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              For Customers
            </h3>
            <div className="space-y-3">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <p className="text-sm text-gray-700 mb-3">
                  Join through LINE for personalized service
                </p>

                {/* QR Code */}
                <ModalQRCode />

                <div className="mt-3">
                  <Link
                    href="/line-app"
                    className="inline-block bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Join through LINE
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right: For Owners */}
          <div className="pl-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('auth.forOwners') || 'For Owners'}
            </h3>
            <div className="space-y-3">
              {mode === 'login' ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent('openLoginModal'));
                  }}
                  className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
                >
                  {tAuth('loginAsOwner') || 'Login as Owner'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent('openSignupModal'));
                  }}
                  className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
                >
                  {tAuth('joinAsOwner') || 'Join as Owner'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

