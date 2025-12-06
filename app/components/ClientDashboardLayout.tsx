"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";

// Client-side wrapper to prevent SSR hydration issues
// Uses useEffect to check pathname after mount to avoid SSR/client mismatch
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // During SSR and initial render, render children directly to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }
  
  // Routes that should NOT use DashboardLayout (they have their own layouts)
  const excludedRoutes = [
    "/", // Landing page has MinimalNavbar
    "/staff-dashboard", // Staff dashboard has its own layout
  ];
  
  // Check if current route should be excluded
  const isExcluded = excludedRoutes.some(route => 
    pathname === route || pathname?.startsWith(route + "/")
  );
  
  if (isExcluded) {
    return <>{children}</>;
  }
  
  // For all other routes, use DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>;
}

