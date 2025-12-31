"use client";

import React from "react";
import { LineAppI18nProvider, LineAppLanguageSelector, useLineAppI18n } from "./i18n";
import { usePathname, useRouter } from "next/navigation";

function TopBar() {
  const { t } = useLineAppI18n();
  const pathname = usePathname();
  const router = useRouter();

  const showBack = pathname !== "/line-app";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-[80px]">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              ← {t("back")}
            </button>
          ) : (
            <span className="text-sm font-semibold text-gray-900">{t("appName")}</span>
          )}
        </div>

        <div className="flex-1" />

        <LineAppLanguageSelector />
      </div>
    </div>
  );
}

export default function LineAppShell({ children }: { children: React.ReactNode }) {
  return (
    <LineAppI18nProvider>
      <TopBar />
      <div className="pt-14">{children}</div>
    </LineAppI18nProvider>
  );
}


