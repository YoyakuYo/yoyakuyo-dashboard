"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ShopCodeSearch() {
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = codeInput.replace(/[^0-9]/g, "");
    if (!digits) {
      setError(t("shopNumberError") || "Enter the shop code number.");
      return;
    }

    const normalized = "S" + digits.padStart(4, "0");
    router.push(`/shops/code/${normalized}`);
  };

  return (
    <section id="shop-number-search" className="max-w-6xl mx-auto px-4 mt-10">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {t("shopNumberSearchTitle") || "Search by shop number"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("shopNumberSearchDescription") ||
              "Enter the shop number from the poster or dashboard (e.g. 12 → S0012)."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={t("shopNumberExamplePlaceholder") || "e.g. 12 or S0012"}
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("shopNumberSearchButton") || "Search"}
          </button>
        </form>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

