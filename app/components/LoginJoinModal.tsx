// apps/dashboard/app/components/LoginJoinModal.tsx
// Unified Login/Join modal with two columns (Customers/Owners)

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
          {t('auth.getStarted') || 'Get Started'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: For Customers */}
          <div className="border-r border-gray-200 pr-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('auth.forCustomers') || 'For Customers'}
            </h3>
            <div className="space-y-3">
              {mode === 'login' ? (
                <Link
                  href="/customer-login"
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {tAuth('loginAsCustomer') || 'Login as Customer'}
                </Link>
              ) : (
                <Link
                  href="/customer-signup"
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {tAuth('joinAsCustomer') || 'Sign Up as Customer'}
                </Link>
              )}
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

