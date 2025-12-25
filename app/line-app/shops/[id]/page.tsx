"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/apiClient";

export const dynamic = 'force-dynamic';

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

interface Shop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  phone?: string;
  main_image_url?: string;
  image_url?: string;
  cover_photo_url?: string;
  logo_url?: string;
  category?: string;
  is_verified?: boolean;
  verified_at?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
  description?: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface Review {
  id: string;
  rating: number;
  content?: string;
  comment?: string; // Legacy field
  customer_name?: string;
  guest_name?: string;
  author_type?: 'guest' | 'user' | 'line';
  created_at: string;
}

export default function LineShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Booking form state
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string>("");
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [lineUserId, setLineUserId] = useState<string>("");

  // Favorites state for LINE customers (parity with web customers)
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    const fetchShop = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    };

    const fetchServices = async () => {
      try {
        const res = await fetch(`${apiUrl}/services?shop_id=${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : data.services || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
    fetchServices();
    
    // Get LINE user ID for reviews
    const getLineUserId = async () => {
      if (typeof window !== "undefined" && window.liff) {
        try {
          const profile = await window.liff.getProfile();
          setLineUserId(profile.userId);
        } catch (err) {
          console.error("Error getting LINE profile:", err);
        }
      }
    };
    getLineUserId();
  }, [shopId]);

  // Initialize canonical customerId for LINE user (used for favorites)
  useEffect(() => {
    const initCustomer = async () => {
      if (typeof window === "undefined" || !window.liff || !apiUrl) {
        return;
      }

      try {
        let idToken: string | null = null;

        try {
          idToken = await window.liff.getIDToken();
        } catch (err) {
          console.error("[LINE Favorites] Failed to get ID token:", err);
        }

        if (!idToken) {
          return;
        }

        const verifyRes = await fetch(`${apiUrl}/api/line/liff/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!verifyRes.ok) {
          console.warn("[LINE Favorites] Failed to verify ID token for favorites");
          return;
        }

        const verifyData = await verifyRes.json();
        if (verifyData?.customer_id) {
          setCustomerId(verifyData.customer_id);
        }
      } catch (err) {
        console.error("[LINE Favorites] Error initializing customer:", err);
      }
    };

    initCustomer();
  }, []);

  // Load favorite status for this shop when customerId is available
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!customerId || !apiUrl || !shopId) return;

      try {
        const res = await fetch(`${apiUrl}/customers/favorites`, {
          headers: {
            "x-user-id": customerId,
          },
        });

        if (!res.ok) {
          console.warn("[LINE Favorites] Failed to load favorites:", res.status);
          return;
        }

        const data = await res.json();
        const favorites = Array.isArray(data)
          ? data
          : Array.isArray(data.favorites)
          ? data.favorites
          : [];

        const isFav = favorites.some(
          (f: any) => f.shop_id === shopId || f.shops?.id === shopId
        );
        setIsFavorite(isFav);
      } catch (err) {
        console.error("[LINE Favorites] Error loading favorites:", err);
      }
    };

    loadFavoriteStatus();
  }, [customerId, shopId]);

  const toggleFavorite = async () => {
    if (!apiUrl) {
      alert("API URL is not configured. Please try again later.");
      return;
    }

    if (!shopId) return;

    // Get LINE identity - ALWAYS send headers even if customerId resolution failed
    let lineUserId = "";
    let idToken: string | null = null;
    
    if (typeof window !== "undefined" && window.liff) {
      try {
        const profile = await window.liff.getProfile();
        lineUserId = profile.userId;
        idToken = await window.liff.getIDToken();
      } catch (err) {
        console.error("[LINE Favorites] Failed to get LINE identity:", err);
        alert("Please open this page from the LINE app while logged in to save favorites.");
        return;
      }
    }

    if (!lineUserId) {
      alert("Please open this page from the LINE app while logged in to save favorites.");
      return;
    }

    setFavoriteLoading(true);

    try {
      // CRITICAL: Backend /customers/favorites requires x-user-id (customer_id)
      // customer_id from verify endpoint IS the auth.users.id
      // get_or_create_customer_from_line creates both auth.users and customers records
      // So we MUST resolve customer_id before making the API call
      let finalCustomerId = customerId;
      
      if (!finalCustomerId && idToken) {
        // Try to resolve customer_id from verify endpoint
        try {
          const verifyRes = await fetch(`${apiUrl}/api/line/liff/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: idToken }),
          });
          
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            finalCustomerId = verifyData?.customer_id;
            if (finalCustomerId) {
              // Update state for future calls
              setCustomerId(finalCustomerId);
            }
          }
        } catch (err) {
          console.warn("[LINE Favorites] Failed to resolve customer_id:", err);
        }
      }
      
      // Backend REQUIRES x-user-id to check auth.users
      if (!finalCustomerId) {
        alert("Failed to verify your identity. Please try again.");
        setFavoriteLoading(false);
        return;
      }
      
      // Build headers - MUST include customer_id as x-user-id
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": finalCustomerId, // REQUIRED: Backend checks auth.users with this
        "x-customer-id": finalCustomerId, // Also send as customer-id for compatibility
        "x-line-user-id": lineUserId, // Include LINE identity for logging
      };
      
      // Include ID token if available
      if (idToken) {
        headers["x-id-token"] = idToken;
      }

      if (isFavorite) {
        // Remove favorite
        const res = await fetch(`${apiUrl}/customers/favorites/${shopId}`, {
          method: "DELETE",
          headers,
        });

        if (res.ok) {
          setIsFavorite(false);
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("[LINE Favorites] Failed to remove favorite:", errorData);
          alert(errorData.error || "Failed to remove favorite");
        }
      } else {
        // Add favorite
        const res = await fetch(`${apiUrl}/customers/favorites`, {
          method: "POST",
          headers,
          body: JSON.stringify({ shop_id: shopId }),
        });

        if (res.ok) {
          setIsFavorite(true);
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("[LINE Favorites] Failed to add favorite:", errorData);
          if (res.status === 409) {
            // Already favorited; just mark as favorite in UI
            setIsFavorite(true);
          } else {
            alert(errorData.error || "Failed to add favorite");
          }
        }
      }
    } catch (err: any) {
      console.error("[LINE Favorites] Error toggling favorite:", err);
      alert(err?.message || "Failed to update favorite");
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  // Fetch reviews
  useEffect(() => {
    if (!shopId) return;
    
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    fetchReviews();
  }, [shopId]);

  // Fetch time slots when date is selected
  useEffect(() => {
    if (selectedDate && selectedServiceId) {
      fetchTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, selectedServiceId]);

  const fetchTimeSlots = async () => {
    if (!selectedDate || !selectedServiceId) {
      setTimeSlots([]);
      return;
    }

    setLoadingTimeSlots(true);
    try {
      const url = `${apiUrl}/shops/${shopId}/availability?date=${selectedDate}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        const slots = Array.isArray(data) ? data : [];
        setTimeSlots(slots);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      setBookingError("Please select a service, date, and time");
      return;
    }

    setSubmitting(true);
    setBookingError("");
    setBookingSuccess(false);

    try {
      // Get LINE user ID and display name from LIFF
      let lineUserId = "";
      let lineDisplayName = "";
      if (typeof window !== "undefined" && window.liff) {
        try {
          const profile = await window.liff.getProfile();
          lineUserId = profile.userId;
          lineDisplayName = profile.displayName || "";
          console.log("[LINE Booking] LINE User ID:", lineUserId);
          console.log("[LINE Booking] LINE Display Name:", lineDisplayName);
        } catch (err) {
          console.error("[LINE Booking] ❌ Could not get LINE profile:", err);
        }
      } else {
        console.warn("[LINE Booking] ⚠️ LIFF not available - LINE notifications may not work");
      }

      // Find the selected timeslot
      const selectedSlot = timeSlots.find(slot => {
        const time = slot.start_time.split(':').slice(0, 2).join(':');
        return time === selectedTime;
      });

      if (!selectedSlot) {
        setBookingError("Please select a valid time slot.");
        setSubmitting(false);
        return;
      }

      // Use the timeslot's start_time and end_time directly
      const startDateTime = new Date(`${selectedDate}T${selectedSlot.start_time}`);
      const endDateTime = new Date(`${selectedDate}T${selectedSlot.end_time}`);

      const res = await fetch(`${apiUrl}/api/line/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_user_id: lineUserId,
          line_display_name: lineDisplayName, // Send display name from LIFF
          shop_id: shopId,
          service_id: selectedServiceId,
          date: selectedDate,
          time: selectedTime,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          time_slot: `${selectedSlot.start_time}-${selectedSlot.end_time}`,
        }),
      });

      if (res.ok) {
        setBookingSuccess(true);
        // Reset form
        setSelectedServiceId("");
        setSelectedDate("");
        setSelectedTime("");
        setTimeSlots([]);
        // Redirect to bookings page after 2 seconds
        setTimeout(() => {
          // BUG 1 FIX: After booking success, navigate with refresh flag
          // The bookings page will use ID token endpoint to fetch immediately
          router.push(`/line-app/bookings?success=true&refresh=${Date.now()}`);
        }, 2000);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to create booking" }));
        setBookingError(errorData.error || "Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setBookingError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get available dates (next 30 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0 || !reviewContent.trim()) {
      console.error('[Shop Reviews] Validation failed: rating or content missing');
      alert('Please provide both a rating and review content.');
      return;
    }

    if (!shopId) {
      console.error('[Shop Reviews] ❌ CRITICAL: shop_id is missing');
      alert('Shop information is missing. Cannot submit review.');
      return;
    }

    if (!lineUserId) {
      console.error('[Shop Reviews] ❌ CRITICAL: line_user_id is missing');
      alert('User identification failed. Please try again.');
      return;
    }

    setSubmittingReview(true);
    try {
      // Get ID token for LINE user
      let idToken: string | null = null;
      if (typeof window !== "undefined" && window.liff) {
        try {
          idToken = await window.liff.getIDToken();
          console.log('[Shop Reviews] ✅ Got ID token for LINE user');
        } catch (tokenError) {
          console.error('[Shop Reviews] ❌ Failed to get ID token:', tokenError);
          throw new Error('Failed to authenticate. Please try again.');
        }
      }

      if (!idToken) {
        console.error('[Shop Reviews] ❌ ID token is missing');
        throw new Error('Authentication failed. Please try again.');
      }

      console.log('[Shop Reviews] Submitting review:', {
        shop_id: shopId,
        rating: reviewRating,
        content_length: reviewContent.trim().length,
        line_user_id: lineUserId,
        has_id_token: !!idToken,
      });

      const res = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-id-token': idToken,
          'x-line-user-id': lineUserId,
        },
        body: JSON.stringify({
          shop_id: shopId,
          rating: reviewRating,
          content: reviewContent.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to submit review' }));
        console.error('[Shop Reviews] ❌ Review submission failed:', {
          status: res.status,
          error: errorData.error || errorData.details || 'Unknown error',
        });
        throw new Error(errorData.error || errorData.details || 'Failed to submit review');
      }

      const reviewData = await res.json();
      console.log('[Shop Reviews] ✅ Review submitted successfully:', reviewData);

      // Success feedback
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent('');
      
      // Show success message
      alert('Review submitted successfully! Thank you for your feedback.');
      
      // Reload reviews
      const reviewsRes = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(Array.isArray(data) ? data : []);
        console.log('[Shop Reviews] ✅ Reloaded reviews:', data.length || 0);
      } else {
        console.warn('[Shop Reviews] ⚠️ Failed to reload reviews, but submission succeeded');
      }
    } catch (error: any) {
      console.error('[Shop Reviews] ❌ Error submitting review:', error);
      const errorMessage = error.message || 'Failed to submit review. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Shop not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">{shop.name}</h1>
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isFavorite
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <span>{isFavorite ? "♥" : "♡"}</span>
              <span>{isFavorite ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Shop Image */}
      {(shop.main_image_url || shop.image_url || shop.cover_photo_url || shop.logo_url) && (
        <div className="w-full h-64 bg-gray-200">
          <img
            src={shop.main_image_url || shop.image_url || shop.cover_photo_url || shop.logo_url}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Shop Details */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{shop.name}</h2>
          
          {shop.address && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">📍 Address</p>
              <p className="text-gray-900">{shop.address}</p>
            </div>
          )}

          {shop.phone && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">📞 Phone</p>
              <p className="text-gray-900">{shop.phone}</p>
            </div>
          )}

          {shop.description && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-900">{shop.description}</p>
            </div>
          )}
        </div>

        {/* Booking Section - Full Booking Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">📅 Book an Appointment</h3>
          
          {bookingSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Booking successful! Redirecting to your bookings...</p>
            </div>
          )}

          {bookingError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{bookingError}</p>
            </div>
          )}

          {!shop?.is_verified ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">This shop is not yet verified</p>
              <p className="text-sm text-gray-500">
                Bookings will be available once this shop is claimed.
              </p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No services available</p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Service *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setSelectedDate("");
                    setSelectedTime("");
                    setTimeSlots([]);
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} {service.price ? `- ¥${service.price}` : ''} ({service.duration} min)
                    </option>
                  ))}
                </select>
                {selectedServiceId && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    {(() => {
                      const service = services.find(s => s.id === selectedServiceId);
                      return service ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-600">
                            Duration: {service.duration} minutes
                            {service.price && ` • Price: ¥${service.price}`}
                          </p>
                          {service.description && (
                            <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Date Selection */}
              {selectedServiceId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date *
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                      setTimeSlots([]);
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a date</option>
                    {getAvailableDates().map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Selection */}
              {selectedDate && selectedServiceId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time *
                  </label>
                  {loadingTimeSlots ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 text-sm mt-2">Loading available times...</p>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        No available times for this date. Please try another date.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => {
                        const time = slot.start_time.split(':').slice(0, 2).join(':');
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              selectedTime === time
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedServiceId || !selectedDate || !selectedTime || submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">⭐ Reviews</h3>
          
          {showReviewForm ? (
            <div className="mb-6">
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-3xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your review *</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Share your experience..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingReview || reviewRating === 0 || !reviewContent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewContent('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Write Review
            </button>
          )}
          
          {loadingReviews ? (
            <p className="text-gray-500 text-sm">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {review.guest_name || review.customer_name || 'Customer'} • {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{review.content || review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

