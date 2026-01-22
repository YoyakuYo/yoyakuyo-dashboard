// apps/dashboard/app/components/AuthGuard.tsx
// Component to protect routes - redirects to login if not authenticated

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log("🔐 AUTHGUARD STATE:", { user: !!user, loading, userId: user?.id });

  useEffect(() => {
    if (!loading && !user) {
      console.log("🔐 AUTHGUARD: No user, redirecting to /");
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    console.log("🔐 AUTHGUARD: Still loading, showing spinner");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("🔐 AUTHGUARD: No user, returning null (will redirect)");
    return null; // Will redirect
  }

  console.log("🔐 AUTHGUARD: User authenticated, rendering children");
  return <>{children}</>;
}

