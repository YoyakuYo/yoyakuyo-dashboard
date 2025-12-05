"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

export default function StaffNavLink() {
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStaffAccess = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsStaff(false);
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiUrl}/staff/profile`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        setIsStaff(response.ok);
      } catch (error) {
        console.error("Error checking staff access:", error);
        setIsStaff(false);
      } finally {
        setLoading(false);
      }
    };

    checkStaffAccess();
  }, []);

  if (loading || !isStaff) {
    return null;
  }

  return (
    <Link
      href="/staff-dashboard"
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
    >
      <span className="mr-2">👨‍💼</span>
      Staff Dashboard
    </Link>
  );
}

