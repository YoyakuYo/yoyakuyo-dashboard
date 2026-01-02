// Admin disputes & complaints page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import DisputesTable from "@/app/components/admin/DisputesTable";

interface Dispute {
  id: string;
  user_id: string;
  user_type: 'owner' | 'customer' | 'admin';
  booking_id: string | null;
  conversation_id: string | null;
  shop_id: string | null;
  dispute_type: 'booking_issue' | 'payment_issue' | 'service_quality' | 'shop_claim' | 'account_issue' | 'other';
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed' | 'escalated';
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  shops?: {
    id: string;
    name: string;
    address?: string;
  };
  bookings?: {
    id: string;
    status: string;
    booking_date: string;
  };
  conversations?: {
    id: string;
    customer_type: string;
    customer_ref: string;
  };
}

export default function AdminDisputesPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    dispute_type: "",
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
      loadDisputes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, filters.status, filters.dispute_type]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.dispute_type) params.append("dispute_type", filters.dispute_type);

      const response = await fetch(`${apiUrl}/admin/disputes?${params}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load disputes");
      }

      const data = await response.json();
      setDisputes(data.disputes || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error loading disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetails = async (disputeId: string) => {
    try {
      const response = await fetch(`${apiUrl}/admin/disputes/${disputeId}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDispute(data);
        setResolution(data.resolution || "");
      }
    } catch (error: any) {
      console.error("Error loading dispute details:", error);
    }
  };

  const handleSelectDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    fetchDisputeDetails(dispute.id);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution.trim()) {
      alert(t("admin.resolutionRequired") || "Resolution is required");
      return;
    }

    try {
      setResolving(true);
      const response = await fetch(`${apiUrl}/admin/disputes/${selectedDispute.id}/resolve`, {
        method: "POST",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resolution: resolution,
          status: 'resolved',
        }),
      });

      if (response.ok) {
        setResolution("");
        fetchDisputeDetails(selectedDispute.id);
        loadDisputes();
        alert(t("admin.disputeResolved") || "Dispute resolved successfully");
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.resolveFailed") || "Failed to resolve dispute"));
      }
    } catch (error: any) {
      console.error("Error resolving dispute:", error);
      alert(error.message || (t("admin.resolveFailed") || "Failed to resolve dispute"));
    } finally {
      setResolving(false);
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
          {t("admin.disputes") || "Disputes & Complaints"}
        </h1>
        <p className="text-gray-600">{t("admin.disputesDesc") || "Handle user disputes and complaints"}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByStatus") || "Filter by Status"}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.allStatuses") || "All Statuses"}</option>
              <option value="open">{t("admin.open") || "Open"}</option>
              <option value="investigating">{t("admin.investigating") || "Investigating"}</option>
              <option value="resolved">{t("admin.resolved") || "Resolved"}</option>
              <option value="closed">{t("admin.closed") || "Closed"}</option>
              <option value="escalated">{t("admin.escalated") || "Escalated"}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByType") || "Filter by Type"}
            </label>
            <select
              value={filters.dispute_type}
              onChange={(e) => setFilters({ ...filters, dispute_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.allTypes") || "All Types"}</option>
              <option value="booking_issue">{t("admin.bookingIssue") || "Booking Issue"}</option>
              <option value="payment_issue">{t("admin.paymentIssue") || "Payment Issue"}</option>
              <option value="service_quality">{t("admin.serviceQuality") || "Service Quality"}</option>
              <option value="shop_claim">{t("admin.shopClaim") || "Shop Claim"}</option>
              <option value="account_issue">{t("admin.accountIssue") || "Account Issue"}</option>
              <option value="other">{t("admin.other") || "Other"}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDisputes}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {t("common.refresh") || "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("admin.disputesList") || "Disputes"}
          </h2>
          <DisputesTable
            disputes={disputes}
            loading={loading}
            onRefresh={loadDisputes}
            onSelectDispute={handleSelectDispute}
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
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

        {/* Dispute Details & Resolution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedDispute ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t("admin.disputeDetails") || "Dispute Details"}
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">{t("admin.title") || "Title"}:</p>
                  <p className="text-gray-900 font-medium">{selectedDispute.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("admin.description") || "Description"}:</p>
                  <p className="text-gray-900">{selectedDispute.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("admin.type") || "Type"}:</p>
                  <p className="text-gray-900">
                    {selectedDispute.dispute_type === 'booking_issue' ? (t("admin.bookingIssue") || "Booking Issue") :
                     selectedDispute.dispute_type === 'payment_issue' ? (t("admin.paymentIssue") || "Payment Issue") :
                     selectedDispute.dispute_type === 'service_quality' ? (t("admin.serviceQuality") || "Service Quality") :
                     selectedDispute.dispute_type === 'shop_claim' ? (t("admin.shopClaim") || "Shop Claim") :
                     selectedDispute.dispute_type === 'account_issue' ? (t("admin.accountIssue") || "Account Issue") :
                     (t("admin.other") || "Other")}
                  </p>
                </div>
                {selectedDispute.shops && (
                  <div>
                    <p className="text-sm text-gray-600">{t("admin.shop") || "Shop"}:</p>
                    <p className="text-gray-900">{selectedDispute.shops.name}</p>
                  </div>
                )}
                {selectedDispute.bookings && (
                  <div>
                    <p className="text-sm text-gray-600">{t("admin.booking") || "Booking"}:</p>
                    <p className="text-gray-900">{selectedDispute.bookings.id.substring(0, 8)}...</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">{t("admin.status") || "Status"}:</p>
                  <p className="text-gray-900">{selectedDispute.status}</p>
                </div>
                {selectedDispute.resolution && (
                  <div>
                    <p className="text-sm text-gray-600">{t("admin.resolution") || "Resolution"}:</p>
                    <p className="text-gray-900">{selectedDispute.resolution}</p>
                  </div>
                )}
              </div>

              {/* Resolution Form */}
              {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("admin.resolution") || "Resolution"}
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                    rows={4}
                    placeholder={t("admin.typeResolution") || "Type your resolution..."}
                  />
                  <button
                    onClick={handleResolve}
                    disabled={!resolution.trim() || resolving}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? (t("common.loading") || "Resolving...") : (t("admin.resolveDispute") || "Resolve Dispute")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>{t("admin.selectDispute") || "Select a dispute to view details and resolve"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

