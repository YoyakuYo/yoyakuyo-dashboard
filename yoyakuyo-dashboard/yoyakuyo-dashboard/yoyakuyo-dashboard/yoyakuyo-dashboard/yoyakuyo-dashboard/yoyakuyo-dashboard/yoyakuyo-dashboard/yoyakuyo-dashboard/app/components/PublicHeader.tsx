"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PublicHeader() {
  const pathname = usePathname();
  
  // Determine if this is a public route (same logic as DashboardLayout)
  // Public routes should show the header, owner routes should not
  const isPublicRoute = () => {
    if (!pathname) return false;
    
    // EXACT match for root route
    if (pathname === "/") {
      return true;
    }
    
    // Public browse page
    if (pathname.startsWith("/browse")) {
      return true;
    }
    
    // Public shop detail pages (but not the main /shops dashboard)
    if (pathname.startsWith("/shops/") && pathname !== "/shops") {
      // /shops/[id] is public, but /shops itself is the owner dashboard (protected)
      return true;
    }
    
    // Public booking flow
    if (pathname.startsWith("/book")) {
      return true;
    }
    
    // Public pages
    if (pathname.startsWith("/public")) {
      return true;
    }
    
    // Everything else (including owner routes like /shops, /assistant, etc.) is NOT public
    return false;
  };
  
  // Only show header on public routes
  if (!isPublicRoute()) {
    return null;
  }
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700">
          Yoyaku Yo
        </Link>
      </div>
    </header>
  );
}

