// apps/dashboard/app/components/PublicNavbar.tsx
// Unified public navbar for all public pages

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/lib/useAuth";

export default function PublicNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  
  let t: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const handleLogoClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (user) {
      // Check if user is customer or owner
      try {
        const { getSupabaseClient } = await import("@/lib/supabaseClient");
        const supabase = getSupabaseClient();
        
        const { data: shops } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_user_id", user.id)
          .limit(1);
        
        if (shops && shops.length > 0) {
          router.push('/owner/dashboard');
        } else {
          router.push('/customer/home');
        }
      } catch (error) {
        console.error("Error checking user type:", error);
        const currentPath = pathname || '';
        if (currentPath.startsWith('/customer')) {
          router.push('/customer/home');
        } else if (currentPath.startsWith('/owner')) {
          router.push('/owner/dashboard');
        } else {
          router.push('/customer/home');
        }
      }
    } else {
      router.push('/');
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <a 
            href={user ? (pathname?.startsWith('/customer') ? '/customer/home' : '/owner/dashboard') : '/'}
            onClick={handleLogoClick}
            className="text-3xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-all"
          >
            Yoyaku Yo
          </a>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/categories" 
              className={`text-sm font-medium transition-colors ${
                isActive('/categories') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('nav.browse') || 'Browse'}
            </Link>
            <Link 
              href="/featured" 
              className={`text-sm font-medium transition-colors ${
                isActive('/featured') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('nav.featured') || 'Featured'}
            </Link>
            <Link 
              href="/trending" 
              className={`text-sm font-medium transition-colors ${
                isActive('/trending') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('nav.trending') || 'Trending'}
            </Link>
            <Link 
              href="/regions" 
              className={`text-sm font-medium transition-colors ${
                isActive('/regions') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('nav.regions') || 'Regions'}
            </Link>
            <Link 
              href="/services" 
              className={`text-sm font-medium transition-colors ${
                isActive('/services') 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('nav.services') || 'Services'}
            </Link>
          </nav>

          {/* Right: Language + Login/Join */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'login' } }));
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('nav.login') || 'Login'}
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'join' } }));
              }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              {t('nav.join') || 'Join'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

