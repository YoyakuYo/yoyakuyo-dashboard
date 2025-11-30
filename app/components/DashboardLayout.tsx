// apps/dashboard/app/components/DashboardLayout.tsx
// Applies dashboard layout (Header, Sidebar, AuthGuard) only to non-auth routes
// Auth routes are handled by (auth)/layout.tsx and render without dashboard UI

"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "./AuthGuard";
import Header from "./Header";
import Sidebar from "./Sidebar";
import PublicLayoutWrapper from "./PublicLayoutWrapper";
import { OwnerAIChatProvider, OwnerAIChat } from "./OwnerAIChat";
import { useBookingNotificationsHook } from "@/lib/useBookingNotifications";
import BookingNotificationBar from "./BookingNotificationBar";
import { useBookingNotifications } from "./BookingNotificationContext";
import { MessagesPanel } from "./owner/MessagesPanel";

// Routes that should NOT have dashboard layout (Header, Sidebar, AuthGuard)
const authRoutes: string[] = [];

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
    if (route.startsWith('/shops/services')) {
      return true;
    }
    
    // Everything else is public (uses (public)/layout.tsx)
    return false;
  }, [pathname]);
  
  const isAuthRoute = useMemo(() => authRoutes.includes(pathname || ""), [pathname]);
  
  console.log("🔥 DashboardLayout evaluating route:", pathname, "| isOwnerRoute:", isOwnerRoute, "| isAuthRoute:", isAuthRoute);

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

  // For public routes, wrap with PublicLayoutWrapper (includes header)
  if (!isOwnerRoute) {
    console.log("🔥 DashboardLayout: Applying PublicLayoutWrapper for public route:", pathname);
    return <PublicLayoutWrapper>{children}</PublicLayoutWrapper>;
  }

  // For owner dashboard routes, apply full dashboard layout with AuthGuard
  return (
    <AuthGuard>
      <OwnerAIChatProvider>
        <BookingNotificationsWrapper>
          <Header />
          <Sidebar />
          <main className="lg:ml-64 pt-16 min-h-screen bg-gray-50">
            {children}
          </main>
          <OwnerAIChat />
          <MessagesPanelWrapper />
        </BookingNotificationsWrapper>
      </OwnerAIChatProvider>
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
  useBookingNotificationsHook();
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

