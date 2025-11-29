'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '@/lib/useAuth';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface LandingHeaderProps {
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
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

          {/* Right: Language Switcher Only */}
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}

