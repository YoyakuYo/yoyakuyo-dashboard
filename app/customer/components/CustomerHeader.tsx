"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export default function CustomerHeader() {
  const { user, signOut } = useCustomAuth();
  const router = useRouter();
  const t = useTranslations();
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseClient();
    let channel: any = null;
    
    // Load profile and notifications
    const loadData = async () => {
      // Get customer_profile_id from customer_auth_id
      const { data: profileData } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("customer_auth_id", user.id)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        
        // Load unread notifications using customer_profile_id
        const { data: notifications } = await supabase
          .from("notifications")
          .select("id", { count: "exact" })
          .eq("recipient_type", "customer")
          .eq("recipient_id", profileData.id)
          .eq("is_read", false);
        setUnreadCount(notifications?.length || 0);

        // Subscribe to notification changes
        channel = supabase
          .channel("customer-notifications")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_type=eq.customer&recipient_id=eq.${profileData.id}`,
            },
            async () => {
              // Reload unread count
              const { data: updatedNotifications } = await supabase
                .from("notifications")
                .select("id", { count: "exact" })
                .eq("recipient_type", "customer")
                .eq("recipient_id", profileData.id)
                .eq("is_read", false);
              setUnreadCount(updatedNotifications?.length || 0);
            }
          )
          .subscribe();
      }
    };
    
    loadData();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          Yoyaku Yo
        </Link>

        {/* Right side: Language, Notifications, Profile */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {/* Notifications */}
          <Link
            href="/customer/notifications"
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 text-xs text-white bg-red-500 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

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
                {profile?.name || user?.email?.split("@")[0] || "Customer"}
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
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

