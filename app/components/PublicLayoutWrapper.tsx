// apps/dashboard/app/components/PublicLayoutWrapper.tsx
// Wrapper that applies public layout to all public routes
// This is used in the root layout to ensure all public routes get the header

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrowseAIAssistant } from "../browse/components/BrowseAIAssistant";
import { BrowseAIProvider, useBrowseAIContext } from "./BrowseAIContext";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/lib/useAuth";

function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const browseContext = useBrowseAIContext();
  const router = useRouter();
  const { user } = useAuth();
  
  let tAuth: ReturnType<typeof useTranslations>;
  try {
    tAuth = useTranslations('auth');
  } catch {
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const handleLogoClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (user) {
      // Check if user is customer or owner by checking their profile
      try {
        const { getSupabaseClient } = await import("@/lib/supabaseClient");
        const supabase = getSupabaseClient();
        
        // Check if user has a shop (owner)
        const { data: shops } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_user_id", user.id)
          .limit(1);
        
        if (shops && shops.length > 0) {
          // User is an owner
          router.push('/owner/dashboard');
        } else {
          // User is a customer (or no shop found)
          router.push('/customer/home');
        }
      } catch (error) {
        console.error("Error checking user type:", error);
        // Fallback: check pathname
        const pathname = window.location.pathname;
        if (pathname.startsWith('/customer')) {
          router.push('/customer/home');
        } else if (pathname.startsWith('/owner')) {
          router.push('/owner/dashboard');
        } else {
          router.push('/customer/home');
        }
      }
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Public Header - appears on ALL public pages */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a 
              href={user ? (window.location.pathname.startsWith('/customer') ? '/customer/home' : '/owner/dashboard') : '/'}
              onClick={handleLogoClick}
              className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-amber-700 cursor-pointer transition-all"
            >
              Yoyaku Yo
            </a>
            {/* Right: Language Switcher + Login Buttons */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link
                href="/customer-login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {tAuth('customerLogin') || 'Customer Login'}
              </Link>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openLoginModal'));
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {tAuth('ownerLogin') || 'Owner Login'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Global Public AI Bubble - appears on ALL public pages */}
      <BrowseAIAssistant
        shops={browseContext?.shops || []}
        selectedPrefecture={browseContext?.selectedPrefecture ?? undefined}
        selectedCity={browseContext?.selectedCity ?? undefined}
        selectedCategoryId={browseContext?.selectedCategoryId ?? undefined}
        searchQuery={browseContext?.searchQuery ?? undefined}
        locale={locale as string}
      />
    </div>
  );
}

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrowseAIProvider>
      <PublicLayoutContent>{children}</PublicLayoutContent>
    </BrowseAIProvider>
  );
}

