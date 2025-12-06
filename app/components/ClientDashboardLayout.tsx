"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "./DashboardLayout";

// Client-side wrapper to prevent SSR hydration issues
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // For landing page, render directly without any layout wrapper
  // This prevents hydration errors from layout conflicts
  if (pathname === "/") {
    return <>{children}</>;
  }
  
  // For all other routes, use DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>;
}

