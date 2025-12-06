"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";

/**
 * ConditionalLayout - Renders appropriate layout based on route
 * 
 * This component prevents hydration errors by:
 * 1. Always rendering the same thing during SSR (just children)
 * 2. Only applying layouts after client-side mount
 * 3. Completely excluding certain routes from DashboardLayout
 */
export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // During SSR and initial hydration, always render children directly
  // This ensures server and client render the same HTML
  if (!mounted) {
    return <>{children}</>;
  }
  
  // After mount, check route and apply appropriate layout
  if (!pathname) {
    return <>{children}</>;
  }
  
  // Routes that should NEVER use DashboardLayout (they have their own layouts)
  const excludedFromDashboard = [
    "/",                    // Landing page - has MinimalNavbar
    "/staff-dashboard",     // Staff dashboard - has its own layout
  ];
  
  // Check if route should be excluded
  const shouldExclude = excludedFromDashboard.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
  
  if (shouldExclude) {
    return <>{children}</>;
  }
  
  // For all other routes, use DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>;
}

