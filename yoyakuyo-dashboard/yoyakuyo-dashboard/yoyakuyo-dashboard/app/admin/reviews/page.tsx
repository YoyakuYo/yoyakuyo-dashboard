// Admin reviews & ratings page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface ShopReview {
  id: string;
  shop_id: string;
  booking_id: string | null;
  customer_id: string | null;
  rating: number;
  content: string | null;
  status: string;
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

interface PlatformReview {
  id: string;
  rating: number;
  comment: string | null;
  platform: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shopReviews, setShopReviews] = useState<ShopReview[]>([]);
  const [platformReviews, setPlatformReviews] = useState<PlatformReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shop' | 'platform'>('shop');

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
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load both shop and platform reviews in parallel
      const [shopResponse, platformResponse] = await Promise.all([
        fetch(`${apiUrl}/admin/reviews?page=1&limit=50`, {
          headers: {
            "x-user-id": userId || "",
            "Content-Type": "application/json",
          },
        }),
        fetch(`${apiUrl}/admin/platform-reviews?page=1&limit=50`, {
          headers: {
            "x-user-id": userId || "",
            "Content-Type": "application/json",
          },
        })
      ]);

      if (!shopResponse.ok) {
        throw new Error("Failed to load shop reviews");
      }
      if (!platformResponse.ok) {
        throw new Error("Failed to load platform reviews");
      }

      const [shopData, platformData] = await Promise.all([
        shopResponse.json(),
        platformResponse.json()
      ]);

      setShopReviews(shopData.reviews || []);
      setPlatformReviews(platformData.reviews || []);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      setError(error.message || "Failed to load reviews");
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
          {t("admin.reviews") || "Reviews & Ratings"}
        </h1>
        <p className="text-gray-600">{t("admin.reviewsDesc") || "Moderate reviews and ratings from customers"}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadReviews}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t("common.refresh") || "Refresh"}
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'shop'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Shop Reviews ({shopReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('platform')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'platform'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Platform Reviews ({platformReviews.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'shop' ? (
            <ShopReviewsTable
              reviews={shopReviews}
              loading={loading}
              onRefresh={loadReviews}
              userId={userId || ""}
            />
          ) : (
            <PlatformReviewsTable
              reviews={platformReviews}
              loading={loading}
              onRefresh={loadReviews}
              userId={userId || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Shop Reviews Table Component
function ShopReviewsTable({
  reviews,
  loading,
  onRefresh,
  userId
}: {
  reviews: ShopReview[];
  loading: boolean;
  onRefresh: () => void;
  userId: string;
}) {
  const t = useTranslations();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, string>>({});
  const [editRating, setEditRating] = useState<Record<string, number>>({});

  const handleEdit = async (reviewId: string) => {
    const content = editContent[reviewId];
    const rating = editRating[reviewId];

    if (content === undefined && rating === undefined) {
      alert("Nothing to update");
      return;
    }

    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/reviews/${reviewId}/edit`, {
        method: "PATCH",
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
          rating: rating,
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowEditModal(null);
        setEditContent({ ...editContent, [reviewId]: "" });
        setEditRating({ ...editRating, [reviewId]: 0 });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to edit review");
      }
    } catch (error: any) {
      console.error("Error editing review:", error);
      alert(error.message || "Failed to edit review");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete review");
      }
    } catch (error: any) {
      console.error("Error deleting review:", error);
      alert(error.message || "Failed to delete review");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No shop reviews found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  {review.content || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setShowEditModal(review.id)}
                    disabled={processingId === review.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={processingId === review.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Edit Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={editRating[showEditModal] || ""}
                  onChange={(e) => setEditRating({ ...editRating, [showEditModal]: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Keep current</option>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} stars</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={editContent[showEditModal] || ""}
                  onChange={(e) => setEditContent({ ...editContent, [showEditModal]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Edit review content..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowEditModal(null);
                  setEditContent({ ...editContent, [showEditModal]: "" });
                  setEditRating({ ...editRating, [showEditModal]: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(showEditModal)}
                disabled={processingId === showEditModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processingId === showEditModal ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Platform Reviews Table Component
function PlatformReviewsTable({
  reviews,
  loading,
  onRefresh,
  userId
}: {
  reviews: PlatformReview[];
  loading: boolean;
  onRefresh: () => void;
  userId: string;
}) {
  const t = useTranslations();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showRespondModal, setShowRespondModal] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<Record<string, string>>({});
  const [editRating, setEditRating] = useState<Record<string, number>>({});
  const [adminResponse, setAdminResponse] = useState<Record<string, string>>({});

  const handleEdit = async (reviewId: string) => {
    const comment = editContent[reviewId];
    const rating = editRating[reviewId];

    if (comment === undefined && rating === undefined) {
      alert("Nothing to update");
      return;
    }

    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/platform-reviews/${reviewId}/edit`, {
        method: "PATCH",
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: comment,
          rating: rating,
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowEditModal(null);
        setEditContent({ ...editContent, [reviewId]: "" });
        setEditRating({ ...editRating, [reviewId]: 0 });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to edit review");
      }
    } catch (error: any) {
      console.error("Error editing platform review:", error);
      alert(error.message || "Failed to edit review");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRespond = async (reviewId: string) => {
    const response = adminResponse[reviewId];

    if (!response || !response.trim()) {
      alert("Response is required");
      return;
    }

    try {
      setProcessingId(reviewId);
      const apiResponse = await fetch(`${apiUrl}/admin/platform-reviews/${reviewId}/respond`, {
        method: "POST",
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: response.trim(),
        }),
      });

      if (apiResponse.ok) {
        onRefresh();
        setShowRespondModal(null);
        setAdminResponse({ ...adminResponse, [reviewId]: "" });
      } else {
        const error = await apiResponse.json();
        alert(error.error || "Failed to send response");
      }
    } catch (error: any) {
      console.error("Error responding to platform review:", error);
      alert(error.message || "Failed to send response");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this platform review? This action cannot be undone.")) {
      return;
    }

    try {
      setProcessingId(reviewId);
      const response = await fetch(`${apiUrl}/admin/platform-reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete review");
      }
    } catch (error: any) {
      console.error("Error deleting platform review:", error);
      alert(error.message || "Failed to delete review");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No platform reviews found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {review.customer_name || review.customer_email || "Anonymous"}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setShowRespondModal(review.id)}
                    disabled={processingId === review.id}
                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                  >
                    Respond
                  </button>
                  <button
                    onClick={() => setShowEditModal(review.id)}
                    disabled={processingId === review.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={processingId === review.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Edit Platform Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={editRating[showEditModal] || ""}
                  onChange={(e) => setEditRating({ ...editRating, [showEditModal]: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Keep current</option>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} stars</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={editContent[showEditModal] || ""}
                  onChange={(e) => setEditContent({ ...editContent, [showEditModal]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Edit review comment..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowEditModal(null);
                  setEditContent({ ...editContent, [showEditModal]: "" });
                  setEditRating({ ...editRating, [showEditModal]: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(showEditModal)}
                disabled={processingId === showEditModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processingId === showEditModal ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showRespondModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Respond to Platform Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                <textarea
                  value={adminResponse[showRespondModal] || ""}
                  onChange={(e) => setAdminResponse({ ...adminResponse, [showRespondModal]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Type your response to the customer..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRespondModal(null);
                  setAdminResponse({ ...adminResponse, [showRespondModal]: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond(showRespondModal)}
                disabled={processingId === showRespondModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processingId === showRespondModal ? "Sending..." : "Send Response"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

