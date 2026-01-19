"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

// Legacy /dashboard route.
// This page checks user role and redirects to the appropriate dashboard.
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const doRedirect = async () => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // CRITICAL: Check user role and redirect accordingly
      // Only users with role='owner' should access owner routes
      try {
        const roleResponse = await fetch(`${apiUrl}/users/me`, {
          headers: { 'x-user-id': user.id },
        });

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          const userRole = roleData.user?.role || roleData.role;

          // Redirect based on role
          if (userRole === 'owner') {
            router.replace("/owner/shop-profile");
          } else if (userRole === 'admin') {
            router.replace("/admin");
          } else {
            // Customer or no role: redirect to customer dashboard
            router.replace("/customer/home");
          }
        } else {
          // If role check fails, default to customer dashboard (safer)
          console.warn('Failed to check user role, defaulting to customer dashboard');
          router.replace("/customer/home");
        }
      } catch (roleError) {
        // If role check fails, default to customer dashboard (safer)
        console.error('Error checking user role:', roleError);
        router.replace("/customer/home");
      }
    };

    void doRedirect();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-600">Loading...</p>
    </div>
  );
}


