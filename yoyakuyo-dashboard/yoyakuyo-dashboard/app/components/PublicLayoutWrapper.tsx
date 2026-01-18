// apps/dashboard/app/components/PublicLayoutWrapper.tsx
// Wrapper that applies public layout to all public routes
// This is used in the root layout to ensure all public routes get the header

"use client";

import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import LoginJoinModal from "./LoginJoinModal";

function PublicLayoutContent({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Global Public Header - appears on ALL public pages */}
      <PublicNavbar />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <PublicFooter />

      {/* Unified Login/Join Modal */}
      <LoginJoinModal />

      {/* AI Assistant removed - no longer available for customers */}
    </div>
  );
}

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayoutContent>{children}</PublicLayoutContent>;
}

