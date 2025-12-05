"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

export default function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkStaffAccess = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

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
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking staff access:", error);
        setIsStaff(false);
        router.push("/");
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

  if (!isStaff) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

