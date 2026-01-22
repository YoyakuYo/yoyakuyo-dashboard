// Admin shop detail page - Management view for administrators
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import BackButton from "@/app/components/BackButton";

interface Shop {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  opening_hours?: any | null;
  description?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  categories?: {
    id: string;
    name: string;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  city?: string | null;
  country?: string | null;
  zip_code?: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  owner_user_id: string | null;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  staff_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
}

// interface Review {
//   id: string;
//   user_id: string;
//   user_name: string;
//   rating: number;
//   comment: string | null;
//   created_at: string;
// }

function formatOpeningHours(openingHours: any): string {
  if (!openingHours || typeof openingHours !== 'object') {
    return 'Not specified';
  }

  // Handle Google Places format: { "monday": ["09:00", "18:00"], ... }
  if (openingHours.monday || openingHours.tuesday || openingHours.wednesday) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      const hours = openingHours[day];
      if (Array.isArray(hours) && hours.length >= 2) {
        return `${dayNames[idx]}: ${hours[0]} - ${hours[1]}`;
      }
      return `${dayNames[idx]}: Closed`;
    }).join('\n');
  }

  // Handle weekday_text format: ["Monday: 9:00 AM – 6:00 PM", ...]
  if (Array.isArray(openingHours.weekday_text)) {
    return openingHours.weekday_text.join('\n');
  }

  return JSON.stringify(openingHours);
}

export default function AdminShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params?.id as string;
  const t = useTranslations();

  const [userId, setUserId] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  // const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Get admin user ID
  useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  // Load shop data, recent bookings, and reviews
  useEffect(() => {
    if (userId && shopId) {
      loadShopData();
    }
  }, [userId, shopId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load shop details
      const shopResponse = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (!shopResponse.ok) {
        throw new Error("Failed to load shop details");
      }

      const shopData = await shopResponse.json();
      setShop(shopData);

      // Load recent bookings for this shop
      const bookingsResponse = await fetch(`${apiUrl}/admin/bookings?shop_id=${shopId}&limit=10`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.bookings || []);
      }

      // TODO: Load recent reviews for this shop (reviews endpoint doesn't support shop_id filtering yet)
      // const reviewsResponse = await fetch(`${apiUrl}/admin/reviews?shop_id=${shopId}&limit=10`, {
      //   headers: {
      //     "x-user-id": userId || "",
      //     "Content-Type": "application/json",
      //   },
      // });
      // if (reviewsResponse.ok) {
      //   const reviewsData = await reviewsResponse.json();
      //   setRecentReviews(reviewsData.reviews || []);
      // }

    } catch (error: any) {
      console.error("Error loading shop data:", error);
      setError(error.message || "Failed to load shop data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!shop) return;

    try {
      setProcessingAction('verify');
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_verified: true }),
      });

      if (response.ok) {
        setShop({ ...shop, is_verified: true });
        alert(t("admin.shopVerified"));
      } else {
        const error = await response.json();
        alert(error.error || t("admin.verifyFailed"));
      }
    } catch (error: any) {
      console.error("Error verifying shop:", error);
      alert(error.message || t("admin.verifyFailed"));
    } finally {
      setProcessingAction(null);
    }
  };

  const handleHide = async (hide: boolean) => {
    if (!shop) return;

    try {
      setProcessingAction('hide');
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_hidden: hide }),
      });

      if (response.ok) {
        setShop({ ...shop, is_hidden: hide });
        alert(hide ? t("admin.shopHidden") : t("admin.shopUnhidden"));
      } else {
        const error = await response.json();
        alert(error.error || t("admin.hideFailed"));
      }
    } catch (error: any) {
      console.error("Error hiding shop:", error);
      alert(error.message || t("admin.hideFailed"));
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!shop) return;

    if (!confirm(t("admin.confirmDeleteShop"))) {
      return;
    }

    try {
      setProcessingAction('delete');
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert(t("admin.shopDeleted"));
        router.push('/admin/shops');
      } else {
        const error = await response.json();
        alert(error.error || t("admin.deleteFailed"));
      }
    } catch (error: any) {
      console.error("Error deleting shop:", error);
      alert(error.message || t("admin.deleteFailed"));
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{t("common.loading")}</span>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="space-y-6">
        <BackButton href="/admin/shops" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            {t("admin.shopNotFound")}
          </h2>
          <p className="text-red-600">{error || t("admin.shopDoesNotExist")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <BackButton href="/admin/shops" />
        <div className="flex gap-3">
          {!shop.is_verified && (
            <button
              onClick={handleVerify}
              disabled={processingAction === 'verify'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processingAction === 'verify' ? t("common.loading") : t("admin.verify")}
            </button>
          )}
          <button
            onClick={() => handleHide(!shop.is_hidden)}
            disabled={processingAction === 'hide'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {processingAction === 'hide'
              ? t("common.loading")
              : shop.is_hidden ? t("admin.unhide") : t("admin.hide")}
          </button>
          <button
            onClick={handleDelete}
            disabled={processingAction === 'delete'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {processingAction === 'delete' ? t("common.loading") : t("common.delete")}
          </button>
        </div>
      </div>

      {/* Shop Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Shop Logo */}
          <div className="flex-shrink-0">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Shop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
              <div className="flex gap-2">
                {shop.is_verified && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {t("admin.verified")}
                  </span>
                )}
                {shop.is_hidden && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {t("admin.hidden")}
                  </span>
                )}
              </div>
            </div>

            <p className="text-gray-600 mb-2">{shop.address}</p>

            {shop.description && (
              <p className="text-gray-700 mb-4">{shop.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {shop.phone && (
                <div>
                  <span className="font-medium text-gray-500">{t("myShop.phone")}: </span>
                  <span className="text-gray-900">{shop.phone}</span>
                </div>
              )}
              {shop.email && (
                <div>
                  <span className="font-medium text-gray-500">{t("myShop.email")}: </span>
                  <span className="text-gray-900">{shop.email}</span>
                </div>
              )}
              {shop.website && (
                <div>
                  <span className="font-medium text-gray-500">{t("myShop.website")}: </span>
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {shop.website}
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-500">{t("myShop.created")}: </span>
                <span className="text-gray-900">
                  {new Date(shop.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opening Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("myShop.openingHours")}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {formatOpeningHours(shop.opening_hours)}
            </pre>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("myShop.location")}
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-500">{t("myShop.address")}: </span>
              <span className="text-gray-900">{shop.address}</span>
            </div>
            {shop.city && (
              <div>
                <span className="font-medium text-gray-500">{t("myShop.city")}: </span>
                <span className="text-gray-900">{shop.city}</span>
              </div>
            )}
            {shop.country && (
              <div>
                <span className="font-medium text-gray-500">{t("myShop.country")}: </span>
                <span className="text-gray-900">{shop.country}</span>
              </div>
            )}
            {shop.zip_code && (
              <div>
                <span className="font-medium text-gray-500">{t("myShop.zipCode")}: </span>
                <span className="text-gray-900">{shop.zip_code}</span>
              </div>
            )}
            {(shop.latitude && shop.longitude) && (
              <div className="pt-2">
                <span className="font-medium text-gray-500">Coordinates: </span>
                <span className="text-gray-900 text-xs">
                  {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("admin.recentBookings")}
          </h3>
          <Link
            href={`/admin/bookings?shop=${shopId}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {t("admin.viewAll")}
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t("admin.noRecentBookings")}</p>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{booking.customer_name}</div>
                  <div className="text-sm text-gray-600">
                    {booking.service_name} • {booking.staff_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      try {
                        const date = new Date(booking.booking_date);
                        if (isNaN(date.getTime())) {
                          return `${booking.booking_date} at ${booking.booking_time}`;
                        }
                        return `${date.toLocaleDateString()} at ${booking.booking_time}`;
                      } catch (error) {
                        return `${booking.booking_date} at ${booking.booking_time}`;
                      }
                    })()}
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reviews - TODO: Enable when reviews endpoint supports shop_id filtering */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("admin.recentReviews")}
          </h3>
          <Link
            href={`/admin/reviews?shop=${shopId}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {t("admin.viewAll")}
          </Link>
        </div>

        {recentReviews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t("admin.noRecentReviews")}</p>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{review.user_name}</div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 mr-1">
                      {review.rating}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                )}
                <div className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}