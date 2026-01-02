// Admin reviews & ratings page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ReviewsTable from "@/app/components/admin/ReviewsTable";

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

export default function AdminReviewsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
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
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      const response = await fetch(`${apiUrl}/admin/reviews?${params}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
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

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ReviewsTable
          reviews={reviews}
          loading={loading}
          onRefresh={loadReviews}
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

