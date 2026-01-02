// Verified shops table component
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

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

interface VerifiedShopsTableProps {
  shops: Shop[];
  loading: boolean;
  onRefresh: () => void;
}

export default function VerifiedShopsTable({
  shops,
  loading,
  onRefresh,
}: VerifiedShopsTableProps) {
  const t = useTranslations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  React.useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const handleVerify = async (shopId: string) => {
    if (!confirm(t("admin.confirmVerify") || "Are you sure you want to verify this shop?")) {
      return;
    }

    try {
      setProcessingId(shopId);
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}/verify`, {
        method: "POST",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.verifyFailed") || "Failed to verify shop"));
      }
    } catch (error: any) {
      console.error("Error verifying shop:", error);
      alert(error.message || (t("admin.verifyFailed") || "Failed to verify shop"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (shopId: string) => {
    if (!confirm(t("admin.confirmReject") || "Are you sure you want to reject this shop verification?")) {
      return;
    }

    try {
      setProcessingId(shopId);
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}/reject-verification`, {
        method: "POST",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectReason[shopId] || null,
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowRejectModal(null);
        setRejectReason({ ...rejectReason, [shopId]: "" });
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.rejectFailed") || "Failed to reject shop verification"));
      }
    } catch (error: any) {
      console.error("Error rejecting shop:", error);
      alert(error.message || (t("admin.rejectFailed") || "Failed to reject shop verification"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedShops.size === 0) {
      alert(t("admin.selectShops") || "Please select shops to verify");
      return;
    }

    if (!confirm(t("admin.confirmBulkVerify") || `Are you sure you want to verify ${selectedShops.size} shop(s)?`)) {
      return;
    }

    try {
      const verifyPromises = Array.from(selectedShops).map((shopId) =>
        fetch(`${apiUrl}/admin/shops/${shopId}/verify`, {
          method: "POST",
          headers: {
            "x-user-id": currentUserId || "",
            "Content-Type": "application/json",
          },
        })
      );

      await Promise.all(verifyPromises);
      setSelectedShops(new Set());
      onRefresh();
    } catch (error: any) {
      console.error("Error bulk verifying shops:", error);
      alert(error.message || (t("admin.bulkVerifyFailed") || "Failed to verify shops"));
    }
  };

  const toggleShopSelection = (shopId: string) => {
    const newSelected = new Set(selectedShops);
    if (newSelected.has(shopId)) {
      newSelected.delete(shopId);
    } else {
      newSelected.add(shopId);
    }
    setSelectedShops(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noShopsFound") || "No shops found"}</p>
      </div>
    );
  }

  return (
    <>
      {selectedShops.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {t("admin.selectedShops") || "Selected"} {selectedShops.size} {t("admin.shop") || "shop(s)"}
            </span>
            <button
              onClick={handleBulkVerify}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {t("admin.bulkVerify") || "Bulk Verify"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedShops.size === shops.length && shops.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedShops(new Set(shops.map((s) => s.id)));
                    } else {
                      setSelectedShops(new Set());
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.shopName") || "Shop Name"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.address") || "Address"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.status") || "Status"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.date") || "Date"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.actions") || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shops.map((shop) => (
              <tr key={shop.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedShops.has(shop.id)}
                    onChange={() => toggleShopSelection(shop.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {shop.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {shop.address || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shop.verification_status)}`}>
                    {shop.verification_status === 'approved' ? (t("admin.approved") || "Approved") :
                     shop.verification_status === 'rejected' ? (t("admin.rejected") || "Rejected") :
                     (t("admin.pending") || "Pending")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(shop.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {shop.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(shop.id)}
                        disabled={processingId === shop.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {processingId === shop.id ? (t("common.loading") || "Loading...") : (t("admin.verify") || "Verify")}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(shop.id)}
                        disabled={processingId === shop.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {t("admin.reject") || "Reject"}
                      </button>
                    </>
                  )}
                  {shop.verification_status === 'approved' && (
                    <span className="text-green-600">{t("admin.verified") || "Verified"}</span>
                  )}
                  {shop.verification_status === 'rejected' && (
                    <span className="text-red-600">{t("admin.rejected") || "Rejected"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">{t("admin.rejectVerification") || "Reject Verification"}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.rejectReason") || "Reason"} ({t("common.optional") || "optional"})
            </label>
            <textarea
              value={rejectReason[showRejectModal] || ""}
              onChange={(e) =>
                setRejectReason({ ...rejectReason, [showRejectModal]: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason({ ...rejectReason, [showRejectModal]: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => {
                  if (showRejectModal) {
                    handleReject(showRejectModal);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t("admin.reject") || "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

