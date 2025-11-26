// apps/dashboard/app/components/PublicLayoutWrapper.tsx
// Wrapper that applies public layout to all public routes
// This is used in the root layout to ensure all public routes get the header

"use client";

import Link from "next/link";
import LanguageToggle from "./LanguageToggle";
import { BrowseAIAssistant } from "../browse/components/BrowseAIAssistant";
import { BrowseAIProvider, useBrowseAIContext } from "./BrowseAIContext";
import { useLocale } from "next-intl";

function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const browseContext = useBrowseAIContext();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Public Header - appears on ALL public pages */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700">
              Yoyaku Yo
            </Link>
            <nav className="flex items-center gap-4">
              <LanguageToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

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

