"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

export default function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkStaffAccess = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsAuthenticated(false);
          setIsStaff(false);
          setLoading(false);
          // Redirect to login - trigger the login modal
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('openLoginModal'));
          }
          router.push("/");
          return;
        }

        setIsAuthenticated(true);

        // Check if user is staff
        const response = await fetch(`${apiUrl}/staff/profile`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        if (response.ok) {
          setIsStaff(true);
        } else {
          setIsStaff(false);
          // Don't redirect - let the page show the setup button
        }
      } catch (error) {
        console.error("Error checking staff access:", error);
        setIsStaff(false);
        // Don't redirect on error - let the page handle it
      } finally {
        setLoading(false);
      }
    };

    checkStaffAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show message (redirect already triggered)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the Staff Dashboard.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated (even if not staff), allow access so they can see setup button
  return <>{children}</>;
}

