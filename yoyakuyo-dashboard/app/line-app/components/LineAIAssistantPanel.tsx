"use client";

import React from "react";
import { BrowseAIAssistant } from "@/app/browse/components/BrowseAIAssistant";
import { useLineAppI18n } from "../i18n";

export function LineAIAssistantPanel(props: {
  shops?: any[];
  selectedPrefecture?: string | null;
  selectedCategoryId?: string | null;
  searchQuery?: string;
  lineUserId?: string;
  lineCustomerProfileId?: string;
}) {
  const { t, language } = useLineAppI18n();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("aiTitle")}</h2>
        <p className="text-gray-600 mb-4">{t("aiSubtitle")}</p>

        <BrowseAIAssistant
          variant="embedded"
          shopLinkBasePath="/line-app/shops"
          shops={props.shops || []}
          selectedPrefecture={props.selectedPrefecture ?? undefined}
          selectedCity={undefined}
          selectedCategoryId={props.selectedCategoryId ?? undefined}
          searchQuery={props.searchQuery ?? undefined}
          locale={language}
          lineUserId={props.lineUserId}
          lineCustomerProfileId={props.lineCustomerProfileId}
          uiText={{
            title: t("aiTitle"),
            emptyTitle: t("aiTitle"),
            emptySubtitle: t("aiSubtitle"),
            tryAsking: t("aiTryAsking"),
            placeholder: t("aiPlaceholder"),
            send: t("aiSend"),
            openAriaLabel: t("aiTitle"),
            closeAriaLabel: t("close"),
          }}
        />
      </div>
    </div>
  );
}


