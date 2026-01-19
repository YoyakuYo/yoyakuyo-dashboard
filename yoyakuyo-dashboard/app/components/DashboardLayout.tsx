// apps/dashboard/app/components/DashboardLayout.tsx
// Applies dashboard layout (Header, Sidebar, AuthGuard) only to non-auth routes
// Auth routes are handled by (auth)/layout.tsx and render without dashboard UI

"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "./AuthGuard";
import Header from "./Header";
import Sidebar from "./Sidebar";
import OwnerSidebar from "./OwnerSidebar";
import PublicLayoutWrapper from "./PublicLayoutWrapper";
// AI chat removed
import { useBookingNotificationsHook } from "@/lib/useBookingNotifications";
import BookingNotificationBar from "./BookingNotificationBar";
import { useBookingNotifications } from "./BookingNotificationContext";
import { MessagesPanel } from "./owner/MessagesPanel";
import VerificationBanner from "./VerificationBanner";

// Routes that should NOT have dashboard layout (Header, Sidebar, AuthGuard)
const authRoutes: string[] = [
  // Customer auth pages
  "/customer-login",
  "/customer-signup",
  // Generic auth pages
  "/login",
  "/forgot-password",
  "/reset-password",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Route matching rules:
  // DashboardLayout should ONLY apply to routes in the (owner) folder
  // All other routes are public and use (public)/layout.tsx
  const isOwnerRoute = useMemo(() => {
    const route = pathname || "";
    
    // Owner dashboard routes (protected, should use DashboardLayout)
    const ownerRoutes = [
      '/shops', // Owner dashboard (not /shops/[id] which is public)
      '/assistant',
      '/bookings',
      '/settings',
      '/analytics',
    ];
    
    // Check exact matches
    if (ownerRoutes.includes(route)) {
      return true;
    }
    
    // Check if it starts with owner route patterns
    if (route.startsWith('/shops/services') || 
        route.startsWith('/owner/') || 
        route.startsWith('/owner/subscription')) {
      return true;
    }
    
    // Everything else is public (uses (public)/layout.tsx)
    return false;
  }, [pathname]);
  
  const isAuthRoute = useMemo(() => authRoutes.includes(pathname || ""), [pathname]);
  
  // Removed console.log to reduce noise

  // For auth routes, just pass through - login and signup handle their own styling
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Check if this is a customer route
  const isCustomerRoute = pathname?.startsWith("/customer");
  
  // For customer routes, don't apply any layout (customer layout handles it)
  if (isCustomerRoute) {
    return <>{children}</>;
  }

  // LINE LIFF customer app routes must not use PublicLayoutWrapper (no public navbar/footer, no AI bubble)
  const isLineAppRoute = pathname?.startsWith("/line-app");
  if (isLineAppRoute) {
    return <>{children}</>;
  }

  // Check if this is the landing page (root route) - it has its own MinimalNavbar
  const isLandingPage = pathname === "/";
  
  // For landing page, don't apply any layout (it has its own MinimalNavbar)
  if (isLandingPage) {
    return <>{children}</>;
  }

  // For other public routes, wrap with PublicLayoutWrapper (includes header)
  if (!isOwnerRoute) {
    console.log("🔥 DashboardLayout: Applying PublicLayoutWrapper for public route:", pathname);
    return <PublicLayoutWrapper>{children}</PublicLayoutWrapper>;
  }

  // For owner dashboard routes, apply full dashboard layout with AuthGuard
  return (
    <AuthGuard>
      <BookingNotificationsWrapper>
        {/* Dashboard Layout Container - Flex layout for sidebar + content */}
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar - matches ADMIN pattern */}
          <Sidebar />

          {/* Main Content Area - matches ADMIN pattern */}
          <div className="flex-1 lg:ml-0 flex flex-col">
            {/* Header - Fixed at top of content area */}
            <Header />

            {/* Page Content - Scrollable area below header */}
            <main className="flex-1 overflow-y-auto pt-4 pb-8">
              <div className="px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </BookingNotificationsWrapper>
    </AuthGuard>
  );
}

// MessagesPanelWrapper component to manage panel state
function MessagesPanelWrapper() {
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [initialBookingId, setInitialBookingId] = useState<string | null>(null);
  const pathname = usePathname();

  // Listen for custom event to open messages panel
  useEffect(() => {
    const handleOpenMessages = (e: CustomEvent<{ bookingId?: string }>) => {
      setInitialBookingId(e.detail?.bookingId || null);
      setIsMessagesOpen(true);
    };

    window.addEventListener('openMessagesPanel', handleOpenMessages as EventListener);
    return () => {
      window.removeEventListener('openMessagesPanel', handleOpenMessages as EventListener);
    };
  }, []);

  // Close panel when navigating away from messages route (if it was open via route)
  useEffect(() => {
    if (pathname !== '/messages' && isMessagesOpen) {
      // Only auto-close if we're not explicitly opening via event
      // This allows the panel to stay open when navigating between other pages
    }
  }, [pathname, isMessagesOpen]);

  return (
    <MessagesPanel
      isOpen={isMessagesOpen}
      onClose={() => {
        setIsMessagesOpen(false);
        setInitialBookingId(null);
      }}
      initialBookingId={initialBookingId}
    />
  );
}

// Wrapper component to initialize booking notifications hook and show pop-ups
function BookingNotificationsWrapper({ children }: { children: React.ReactNode }) {
  // Real-time subscription is now handled in BookingNotificationProvider
  const { newBookingNotification, setNewBookingNotification } = useBookingNotifications();
  const router = useRouter();

  const handleDismiss = () => {
    setNewBookingNotification(null);
  };

  const handleViewBooking = (bookingId: string) => {
    setNewBookingNotification(null);
    router.push(`/bookings?highlight=${bookingId}`);
  };

  return (
    <>
      {children}
      {newBookingNotification && (
        <BookingNotificationBar
          notification={newBookingNotification}
          onDismiss={handleDismiss}
          onViewBooking={handleViewBooking}
        />
      )}
    </>
  );
}

