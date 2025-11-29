'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '@/lib/useAuth';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface LandingHeaderProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export function LandingHeader({ onOpenLogin, onOpenSignup }: LandingHeaderProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [isCustomer, setIsCustomer] = useState(false);

  useEffect(() => {
    const checkCustomer = async () => {
      if (user) {
        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from("customer_profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        setIsCustomer(!!data);
      } else {
        setIsCustomer(false);
      }
    };
    checkCustomer();
  }, [user]);
  
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Yoyaku Yo
          </Link>

          {/* Right: Language Switcher + Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            
            {/* Customer Auth Buttons */}
            {isCustomer ? (
              <Link
                href="/customer"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/customer-login"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Customer Login
                </Link>
                <Link
                  href="/customer-signup"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Owner Buttons */}
            <div className="border-l border-gray-300 pl-2 sm:pl-3 flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('home.ownerLogin')}
              </button>
              <button
                onClick={onOpenSignup}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('home.joinAsOwner')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

