"use client";

import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * Conditionally renders the LanguageSwitcher based on the current route.
 * Hides it on LINE app routes since they have their own header.
 */
export function ConditionalLanguageSwitcher() {
  // Show language selector on ALL pages (global, like the logo)
  // Only hide on LINE app routes if needed (they have their own UI)
  const pathname = usePathname();
  
  // Hide language selector on LINE app routes (they have their own UI)
  if (pathname?.startsWith("/line-app")) {
    return null;
  }
  
  return (
    <div className="sticky top-0 left-0 w-full z-[200] bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm flex items-center justify-end px-4 py-2">
      <LanguageSwitcher />
    </div>
  );
}

