// Reviews moderation table component
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Review {
  id: string;
  shop_id: string;
  booking_id: string | null;
  customer_id: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
  shops?: {
    id: string;
    name: string;
  };
  bookings?: {
    id: string;
    status: string;
  };
}

interface ReviewsTableProps {
  reviews: Review[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ReviewsTable({
  reviews,
  loading,
  onRefresh,
}: ReviewsTableProps) {
  const t = useTranslations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState<Record<string, string>>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

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

  const handleApprove = async (reviewId: string) => {
    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/reviews/${reviewId}/approve`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.approveFailed") || "Failed to approve review"));
      }
    } catch (error: any) {
      console.error("Error approving review:", error);
      alert(error.message || (t("admin.approveFailed") || "Failed to approve review"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/reviews/${reviewId}/reject`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectReason[reviewId] || null,
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowRejectModal(null);
        setRejectReason({ ...rejectReason, [reviewId]: "" });
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.rejectFailed") || "Failed to reject review"));
      }
    } catch (error: any) {
      console.error("Error rejecting review:", error);
      alert(error.message || (t("admin.rejectFailed") || "Failed to reject review"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!adminResponse[reviewId] || !adminResponse[reviewId].trim()) {
      alert(t("admin.responseRequired") || "Response is required");
      return;
    }

    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: adminResponse[reviewId],
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowResponseModal(null);
        setAdminResponse({ ...adminResponse, [reviewId]: "" });
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.responseFailed") || "Failed to send response"));
      }
    } catch (error: any) {
      console.error("Error responding to review:", error);
      alert(error.message || (t("admin.responseFailed") || "Failed to send response"));
    } finally {
      setProcessingId(null);
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

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noReviewsFound") || "No reviews found"}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.shop") || "Shop"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("reviews.rating") || "Rating"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("reviews.comment") || "Comment"}
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
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {review.shops?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <span className="text-yellow-400">{"★".repeat(review.rating)}</span>
                    <span className="text-gray-400 ml-1">{"☆".repeat(5 - review.rating)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {review.comment || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {review.is_approved ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {t("admin.approved") || "Approved"}
                    </span>
                  ) : review.is_flagged ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {t("admin.flagged") || "Flagged"}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {t("admin.pending") || "Pending"}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {!review.is_approved && !review.is_flagged && (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={processingId === review.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {t("admin.approve") || "Approve"}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(review.id)}
                        disabled={processingId === review.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {t("admin.reject") || "Reject"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowResponseModal(review.id)}
                    disabled={processingId === review.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    {review.admin_response ? (t("admin.editResponse") || "Edit Response") : (t("admin.respond") || "Respond")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">{t("admin.respondToReview") || "Respond to Review"}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.response") || "Response"}
            </label>
            <textarea
              value={adminResponse[showResponseModal] || ""}
              onChange={(e) =>
                setAdminResponse({ ...adminResponse, [showResponseModal]: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows={4}
              placeholder={t("admin.typeResponse") || "Type your response..."}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(null);
                  setAdminResponse({ ...adminResponse, [showResponseModal]: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => {
                  if (showResponseModal) {
                    handleRespond(showResponseModal);
                  }
                }}
                disabled={processingId === showResponseModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processingId === showResponseModal ? (t("common.loading") || "Loading...") : (t("admin.sendResponse") || "Send Response")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">{t("admin.rejectReview") || "Reject Review"}</h3>
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

