// Admin shop management page
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { useAuth } from "@/lib/useAuth";
import ShopManagementTable from "@/app/components/admin/ShopManagementTable";

interface Shop {
  id: string;
  name: string;
  address: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
  owner_user_id: string | null;
}

export default function AdminShopsPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    verified: "",
    hidden: "",
    search: "",
  });

  useEffect(() => {
    if (user?.id) {
      loadShops();
    }
  }, [user, page, filters]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (filters.verified) params.append("verified", filters.verified);
      if (filters.hidden) params.append("hidden", filters.hidden);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`${apiUrl}/admin/shops?${params}`, {
        headers: {
          "x-user-id": user?.id || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load shops");
      }

      const data = await response.json();
      setShops(data.shops || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error loading shops:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("admin.shops")}
        </h1>
        <p className="text-gray-600">{t("admin.manageShops")}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByVerification")}
            </label>
            <select
              value={filters.verified}
              onChange={(e) =>
                setFilters({ ...filters, verified: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.all")}</option>
              <option value="true">{t("admin.verified")}</option>
              <option value="false">{t("admin.unverified")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByVisibility")}
            </label>
            <select
              value={filters.hidden}
              onChange={(e) =>
                setFilters({ ...filters, hidden: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.all")}</option>
              <option value="false">{t("admin.visible")}</option>
              <option value="true">{t("admin.hidden")}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("common.search")}
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder={t("admin.searchShops")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ShopManagementTable
          shops={shops}
          loading={loading}
          onRefresh={loadShops}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.previous")}
          </button>
          <span className="text-gray-600">
            {t("admin.page")} {page} {t("admin.of")} {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}

