// apps/dashboard/app/components/PublicLayoutWrapper.tsx
// Wrapper that applies public layout to all public routes
// This is used in the root layout to ensure all public routes get the header

"use client";

import { BrowseAIAssistant } from "../browse/components/BrowseAIAssistant";
import { BrowseAIProvider, useBrowseAIContext } from "./BrowseAIContext";
import { useLocale } from "next-intl";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import LoginJoinModal from "./LoginJoinModal";

function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const browseContext = useBrowseAIContext();

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

      {/* Global Public AI Bubble - appears on ALL public pages */}
      <BrowseAIAssistant
        shops={browseContext?.shops || []}
        selectedPrefecture={browseContext?.selectedPrefecture ?? undefined}
        selectedCity={browseContext?.selectedCity ?? undefined}
        selectedCategoryId={browseContext?.selectedCategoryId ?? undefined}
        searchQuery={browseContext?.searchQuery ?? undefined}
        locale={locale as string}
      />
    </div>
  );
}

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrowseAIProvider>
      <PublicLayoutContent>{children}</PublicLayoutContent>
    </BrowseAIProvider>
  );
}

