"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";

export default function CustomerHeader() {
  const { user, signOut } = useCustomAuth();
  const router = useRouter();
  const t = useTranslations();
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseClient();
    
    // Load profile
    const loadProfile = async () => {
      const { data: profileData } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("customer_auth_id", user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }
    };
    
    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "C";
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 lg:left-64">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo - Links to customer home, does NOT log out */}
        <button
          onClick={(e) => {
            // Ensure logo click only navigates, never logs out
            e.preventDefault();
            e.stopPropagation();
            router.push("/customer/home");
          }}
          className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          {t('home.title') || 'Yoyaku Yo'}
        </button>

        {/* Right side: Profile */}
        <div className="flex items-center gap-4">
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {getInitials()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {profile?.name || user?.email?.split("@")[0] || t('customer.customer')}
              </span>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  href="/customer/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  {t('customer.profile') || 'Settings'}
                </Link>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t('nav.logout') || 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

