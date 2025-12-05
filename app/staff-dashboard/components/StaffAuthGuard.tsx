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

  // Only redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // If authenticated (even if not staff), allow access so they can see setup button
  return <>{children}</>;
}

