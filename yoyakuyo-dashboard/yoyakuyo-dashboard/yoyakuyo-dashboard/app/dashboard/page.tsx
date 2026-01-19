"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

// Legacy /dashboard route.
// This page is deprecated and now just redirects owners to the new My Shop dashboard.
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
      } else {
        // Single owner dashboard entry point
        router.replace("/shops");
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


