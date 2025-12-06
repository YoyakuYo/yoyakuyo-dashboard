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
  
  // After mount, check if this is the landing page
  if (pathname === "/") {
    return <>{children}</>;
  }
  
  // For all other routes, use DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>;
}

