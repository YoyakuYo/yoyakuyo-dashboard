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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // HARD DEBUG LOGGING
  console.log("🔥 DASHBOARD LAYOUT MOUNTED FOR PATH:", pathname);
  console.log("🔥 DASHBOARD LAYOUT CHILDREN:", !!children);

  // Listen for sidebar drawer open events
  useEffect(() => {
    const handleOpenSidebar = () => setDrawerOpen(true);
    window.addEventListener('openSidebarDrawer', handleOpenSidebar);
    return () => window.removeEventListener('openSidebarDrawer', handleOpenSidebar);
  }, []);
  
  // Route matching rules:
  // DashboardLayout should ONLY apply to routes in the (owner) folder
  // All other routes are public and use (public)/layout.tsx
  const isOwnerRoute = useMemo(() => {
    const route = pathname || "";
    console.log("🔍 CHECKING ROUTE FOR OWNER LAYOUT:", route);

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
      console.log("✅ EXACT OWNER ROUTE MATCH:", route);
      return true;
    }

    // Check if it starts with owner route patterns
    if (route.startsWith('/shops/services') ||
        route.startsWith('/owner/') ||
        route.startsWith('/owner/subscription')) {
      console.log("✅ OWNER ROUTE PATTERN MATCH:", route);
      return true;
    }

    console.log("❌ NOT AN OWNER ROUTE:", route);
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
  console.log("🎯 RENDERING OWNER DASHBOARD LAYOUT FOR:", pathname);
  return (
    <AuthGuard>
      <BookingNotificationsWrapper>
        {/* Dashboard Layout Container - Exact admin pattern */}
        <div className="flex min-h-screen bg-gray-50">
          {/* Mobile hamburger button */}
          <button
            className="lg:hidden fixed top-4 left-4 z-[251] bg-blue-600 text-white p-2 rounded-lg"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openSidebarDrawer'));
              }
            }}
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Mobile drawer overlay */}
          <MobileDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

          {/* Sidebar - returns aside directly */}
          <Sidebar />

          {/* Content area - matches admin exactly */}
          <div className="flex-1 lg:ml-0 flex flex-col">
            {/* Header - inside content area */}
            <Header />

            {/* Main content - scrollable */}
            <main className="flex-1 overflow-auto">
              <div className="p-6 lg:p-8">
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

// Mobile drawer component
function MobileDrawer({ drawerOpen, setDrawerOpen }: { drawerOpen: boolean; setDrawerOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();

  // Owner navigation: put "My Shop" at the top and remove the legacy Dashboard link
  const navItems = [
    { href: '/shops', label: 'nav.myShop', icon: '🏪' },
    { href: '/owner/bookings', label: 'nav.bookings', icon: '📅' },
    { href: '/owner/calendar', label: 'nav.calendar', icon: '📆' },
    { href: '/analytics', label: 'nav.analytics', icon: '📊' },
    { href: '/owner/messages', label: 'nav.messages', icon: '💬' },
    { href: '/owner/support', label: 'nav.contactSupport', icon: '💬' },
    { href: '/owner/subscription', label: 'nav.subscriptions', icon: '💳' },
    { href: '/owner/settings', label: 'nav.settings', icon: '⚙️' },
  ];

  return (
    <div
      className={`lg:hidden fixed inset-0 z-[250] bg-slate-900 text-white transition-transform duration-300 ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ maxWidth: 320 }}
      onClick={() => setDrawerOpen(false)}
    >
      <nav
        className="p-4 h-full flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ height: "100vh", width: "100%" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Owner Dashboard</h1>
          <button
            aria-label="Close menu"
            className="text-2xl text-gray-400"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <li key={item.href}>
                <button
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white font-bold"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push(item.href);
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
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

