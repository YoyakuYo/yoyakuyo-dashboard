// Component to protect admin routes - redirects to /admin/login if not admin
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdmin } from "@/lib/useAdmin";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Don't redirect if we're already on login page
    if (pathname === "/admin/login" || pathname?.startsWith("/admin/login/")) {
      return;
    }

    // Only redirect once
    if (redirectedRef.current) {
      return;
    }

    // If not loading and not admin, redirect to login
    if (!loading && !isAdmin) {
      redirectedRef.current = true;
      router.push("/admin/login");
    }
  }, [isAdmin, loading, router, pathname]);

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

