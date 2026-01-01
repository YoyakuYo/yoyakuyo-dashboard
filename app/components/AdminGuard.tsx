// Component to protect admin routes - redirects if user is not admin
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/useAdmin";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect once
    if (redirectedRef.current) {
      return;
    }

    if (!loading && !isAdmin) {
      redirectedRef.current = true;
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

