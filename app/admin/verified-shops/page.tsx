// Admin verified shops page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import VerifiedShopsTable from "@/app/components/admin/VerifiedShopsTable";

interface Shop {
  id: string;
  name: string;
  address: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  shop_claim_requests?: Array<{
    id: string;
    status: string;
    claimant_name: string;
    claimant_email: string;
    files?: Array<{
      id: string;
      file_path: string;
      file_name: string;
    }>;
  }>;
}

export default function AdminVerifiedShopsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all", // Default to all
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get user from Supabase Auth
  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error("Error getting user session:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, filters.status]);

  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }

      const response = await fetch(`${apiUrl}/admin/shops/verification?${params}`, {
        headers: {
          "x-user-id": userId || "",
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
      setError(error.message || "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("admin.verifiedShops") || "Verified Shops"}
        </h1>
        <p className="text-gray-600">{t("admin.verifiedShopsDesc") || "Manage shop verification status"}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadShops}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t("common.refresh") || "Refresh"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByVerificationStatus") || "Filter by Verification Status"}
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1); // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">{t("admin.allVerification") || "All"}</option>
              <option value="pending">{t("admin.pending") || "Pending"}</option>
              <option value="approved">{t("admin.approved") || "Approved"}</option>
              <option value="rejected">{t("admin.rejected") || "Rejected"}</option>
            </select>
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              onClick={loadShops}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {t("common.refresh") || "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <VerifiedShopsTable
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
            {t("common.previous") || "Previous"}
          </button>
          <span className="text-gray-600">
            {t("admin.page") || "Page"} {page} {t("admin.of") || "of"} {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.next") || "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

