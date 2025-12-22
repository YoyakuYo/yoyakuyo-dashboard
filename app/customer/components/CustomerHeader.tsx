"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";
import NotificationBell from "@/app/components/NotificationBell";

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
        <Link 
          href="/customer/home" 
          className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          onClick={(e) => {
            // Ensure logo click only navigates, never logs out
            e.preventDefault();
            router.push("/customer/home");
          }}
        >
          {t('home.title') || 'Yoyaku Yo'}
        </Link>

        {/* Right side: Notifications, Logout Button, Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          {profile && (
            <NotificationBell userType="customer" userId={profile.id} />
          )}

          {/* Logout Button - Visible and accessible */}
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            title={t('nav.logout') || 'Logout'}
          >
            <span className="hidden sm:inline">{t('nav.logout') || 'Logout'}</span>
            <svg
              className="w-5 h-5 sm:hidden"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>

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
                  {t('customer.profile')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

