"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";

export default function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkCustomerAuth = async () => {
      if (loading) return;

      if (!user) {
        // No user, redirect to customer login
        router.push("/customer-login");
        return;
      }

      // Check if user has customer profile
      const supabase = getSupabaseClient();
      const { data: profile, error } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        // User exists but no customer profile - might be owner
        // Check if they have owner profile
        const { data: ownerProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (ownerProfile) {
          // This is an owner, redirect to owner dashboard
          router.push("/dashboard");
          return;
        }

        // No profile at all, redirect to customer signup to create one
        router.push("/customer-signup");
        return;
      }

      setChecking(false);
    };

    checkCustomerAuth();
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

