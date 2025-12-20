"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

// PART 5: Reviews section component for LINE dashboard
function ReviewsSection({ shopId, lineUserId }: { shopId: string; lineUserId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    if (shopId) {
      fetchReviews();
    }
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !content.trim()) {
      console.error('[Reviews] Validation failed: rating or content missing');
      alert('Please provide both a rating and review content.');
      return;
    }

    if (!shopId) {
      console.error('[Reviews] ❌ CRITICAL: shop_id is missing');
      alert('Shop information is missing. Cannot submit review.');
      return;
    }

    if (!lineUserId) {
      console.error('[Reviews] ❌ CRITICAL: line_user_id is missing');
      alert('User identification failed. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      // Get ID token for LINE user
      let idToken: string | null = null;
      if (typeof window !== "undefined" && window.liff) {
        try {
          idToken = await window.liff.getIDToken();
          console.log('[Reviews] ✅ Got ID token for LINE user');
        } catch (tokenError) {
          console.error('[Reviews] ❌ Failed to get ID token:', tokenError);
          throw new Error('Failed to authenticate. Please try again.');
        }
      }

      if (!idToken) {
        console.error('[Reviews] ❌ ID token is missing');
        throw new Error('Authentication failed. Please try again.');
      }

      console.log('[Reviews] Submitting review:', {
        shop_id: shopId,
        rating,
        content_length: content.trim().length,
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
          rating,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to submit review' }));
        console.error('[Reviews] ❌ Review submission failed:', {
          status: res.status,
          error: errorData.error || errorData.details || 'Unknown error',
        });
        throw new Error(errorData.error || errorData.details || 'Failed to submit review');
      }

      const reviewData = await res.json();
      console.log('[Reviews] ✅ Review submitted successfully:', reviewData);

      // Success feedback
      setShowForm(false);
      setRating(0);
      setContent('');
      
      // Show success message
      alert('Review submitted successfully! Thank you for your feedback.');
      
      // Reload reviews
      const reviewsRes = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(Array.isArray(data) ? data : []);
        console.log('[Reviews] ✅ Reloaded reviews:', data.length || 0);
      } else {
        console.warn('[Reviews] ⚠️ Failed to reload reviews, but submission succeeded');
      }
    } catch (error: any) {
      console.error('[Reviews] ❌ Error submitting review:', error);
      const errorMessage = error.message || 'Failed to submit review. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h4 className="font-semibold mb-3">Reviews</h4>
      {showForm ? (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your review *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || rating === 0 || !content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Write Review
        </button>
      )}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {review.guest_name || 'Customer'} • {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{review.content || review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Booking {
  id: string;
  customer_id?: string;
  source?: string;
  booking_type?: string; // Legacy field for backward compatibility
  line_user_id?: string; // Legacy field
  start_time: string;
  end_time: string;
  booked_for?: string; // New canonical field
  status: string;
  shop_id?: string;
  shops: { 
    id?: string;
    name: string; 
    address?: string;
    phone?: string;
    line_official_account_id?: string;
  } | Array<{ 
    id?: string;
    name: string; 
    address?: string;
    phone?: string;
    line_official_account_id?: string;
  }>;
  services: { name: string; price?: number; duration_minutes?: number } | Array<{ name: string; price?: number; duration_minutes?: number }>;
}

function LineBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineUserId, setLineUserId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [viewingBookingId, setViewingBookingId] = useState<string | null>(null);
  // PART 5: Review state
  const [showReviews, setShowReviews] = useState<string | null>(null); // shop_id for which to show reviews

  const loadBookings = async () => {
    // BUG 1 FIX: Use ID token-based endpoint for LIFF
    if (typeof window !== "undefined" && window.liff) {
      try {
        const profile = await window.liff.getProfile();
        setLineUserId(profile.userId);

        // Get ID token from LIFF (required for LIFF-specific endpoint)
        let idToken: string | null = null;
        try {
          idToken = await window.liff.getIDToken();
          console.log(`[LINE Bookings Frontend] ✅ Got ID token from LIFF`);
        } catch (idTokenError: any) {
          console.error(`[LINE Bookings Frontend] ❌ Failed to get ID token:`, idTokenError);
          setError(`Failed to get LINE authentication token. Please try again.`);
          setLoading(false);
          return;
        }

        if (!idToken) {
          console.error(`[LINE Bookings Frontend] ❌ ID token is null`);
          setError(`LINE authentication token is missing. Please try again.`);
          setLoading(false);
          return;
        }

        // BUG 1 FIX: Use dedicated LIFF endpoint with ID token
        console.log(`[LINE Bookings Frontend] 📤 Calling LIFF-specific endpoint: ${apiUrl}/api/line/liff/bookings`);
        
        let bookingsRes;
        let bookingsData: Booking[] = [];
        
        try {
          bookingsRes = await fetch(`${apiUrl}/api/line/liff/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: idToken }),
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });
          
          console.log(`[LINE Bookings Frontend] ✅ API responded with status: ${bookingsRes.status}`);
        } catch (fetchError: any) {
          console.error(`[LINE Bookings Frontend] ❌ Fetch failed:`, fetchError);
          console.error(`[LINE Bookings Frontend] ❌ Error name:`, fetchError?.name);
          console.error(`[LINE Bookings Frontend] ❌ Error message:`, fetchError?.message);
          
          // BUG 1 FIX: Better error visibility - do NOT silently set empty bookings
          if (fetchError?.name === 'AbortError' || fetchError?.message?.includes('timeout')) {
            setError(`Request timed out. The API might be slow or unavailable.`);
          } else if (fetchError?.message?.includes('Failed to fetch') || fetchError?.message?.includes('NetworkError')) {
            setError(`Cannot reach the API server. Please check your internet connection or try again later.`);
          } else {
            setError(`Network error: ${fetchError?.message || 'Unknown error'}`);
          }
          
          setLoading(false);
          return; // Don't continue if fetch fails
        }

        if (bookingsRes.ok) {
          try {
            const data = await bookingsRes.json();
            // Response is always an array from LIFF endpoint
            bookingsData = Array.isArray(data) ? data : [];
            
            console.log(`[LINE Bookings Frontend] ✅ Loaded ${bookingsData.length} bookings`);
            
            if (bookingsData.length > 0) {
              bookingsData.forEach((booking: any, index: number) => {
                console.log(`[LINE Bookings Frontend] Booking ${index + 1}:`, {
                  id: booking.id,
                  customer_id: booking.customer_id,
                  source: booking.source,
                  shop: booking.shops?.name || (Array.isArray(booking.shops) ? booking.shops[0]?.name : 'N/A'),
                  service: booking.services?.name || (Array.isArray(booking.services) ? booking.services[0]?.name : 'N/A'),
                  status: booking.status,
                });
              });
            }
            
            setBookings(bookingsData);
            setError(""); // Clear error on success
          } catch (parseError: any) {
            console.error(`[LINE Bookings Frontend] ❌ Failed to parse response:`, parseError);
            setError(`Failed to parse server response: ${parseError?.message || 'Unknown error'}`);
            setBookings([]);
          }
        } else {
          // BUG 1 FIX: Error visibility - log exact error message
          const errorText = await bookingsRes.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP ${bookingsRes.status}` };
          }
          
          console.error(`[LINE Bookings Frontend] ❌ API error (${bookingsRes.status}):`, errorData);
          console.error(`[LINE Bookings Frontend] ❌ Error details:`, errorData.details || errorData.error);
          
          // Do NOT silently set empty bookings - show error
          setError(`Failed to load bookings: ${errorData.details || errorData.error || `HTTP ${bookingsRes.status}`}`);
          setBookings([]);
        }
      } catch (error: any) {
        console.error(`[LINE Bookings Frontend] ❌ Unexpected error:`, error);
        setError(`Error: ${error?.message || 'Failed to load bookings'}`);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    } else {
      setError("LINE app is not available. Please open this page in the LINE app.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // BUG 1 FIX: Reload bookings when success parameter changes
  // Use ID token endpoint which will show the new booking immediately
  useEffect(() => {
    const success = searchParams.get("success");
    const refresh = searchParams.get("refresh");
    if (success === "true" || refresh) {
      // Reload bookings immediately (ID token endpoint should have latest data)
      // Small delay to ensure backend transaction is committed
      setTimeout(() => {
        console.log("[LINE Bookings] Reloading bookings after successful booking creation...");
        loadBookings();
      }, 500); // Reduced delay since we're using ID token endpoint
    }
  }, [searchParams]);

  // TASK 3: View Details handler
  const handleViewDetails = (booking: Booking) => {
    console.log("[LINE Bookings] View Details clicked for booking:", booking.id);
    setViewingBookingId(booking.id);
    
    // Get shop data (handle both array and single object)
    const shopData = Array.isArray(booking.shops) ? booking.shops[0] : booking.shops;
    const serviceData = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    
    // Show booking details in alert/modal (simple implementation)
    const details = `
Booking Details:
- Shop: ${shopData?.name || 'N/A'}
- Service: ${serviceData?.name || 'N/A'}
- Date: ${new Date(booking.start_time).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
- Time: ${new Date(booking.start_time).toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit' 
})} - ${new Date(booking.end_time).toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
- Status: ${booking.status}
- Booking ID: ${booking.id}
    `.trim();
    
    alert(details);
    setViewingBookingId(null);
  };

  // TASK 3: Cancel booking handler
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingBookingId(bookingId);
    console.log("[LINE Bookings] Cancelling booking:", bookingId);

    try {
      // PART 5: Get ID token and LINE user ID for authentication
      let idToken: string | null = null;
      let currentLineUserId: string | null = lineUserId || null;
      
      if (typeof window !== "undefined" && window.liff) {
        try {
          idToken = await window.liff.getIDToken();
          // Get LINE user ID directly from profile
          const profile = await window.liff.getProfile();
          currentLineUserId = profile.userId;
          console.log("[LINE Bookings] Got ID token and LINE user ID");
        } catch (idTokenError) {
          console.error("[LINE Bookings] Failed to get ID token:", idTokenError);
        }
      }

      // Verify ID token and get customer_id
      let customerId: string | null = null;
      if (idToken) {
        const verifyRes = await fetch(`${apiUrl}/api/line/liff/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          customerId = verifyData.customer_id;
          console.log("[LINE Bookings] Verified customer_id:", customerId);
        }
      }

      // PART 5: Cancel booking - send both customer_id and ID token for LINE users
      const cancelHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (customerId) {
        cancelHeaders['x-user-id'] = customerId;
      }
      
      if (idToken) {
        cancelHeaders['x-id-token'] = idToken;
      }
      
      if (currentLineUserId) {
        cancelHeaders['x-line-user-id'] = currentLineUserId;
      }
      
      // PROBLEM A FIX: Add required logging before fetch
      console.log("CANCEL REQUEST", bookingId, apiUrl);
      console.log("[LINE Bookings] Cancelling with headers:", Object.keys(cancelHeaders));
      console.log("[LINE Bookings] Full cancel URL:", `${apiUrl}/bookings/${bookingId}/cancel`);
      
      // PROBLEM A FIX: Ensure absolute URL and proper error handling
      if (!apiUrl) {
        console.error("[LINE Bookings] ❌ CRITICAL: apiUrl is undefined!");
        alert('API URL is not configured. Please check environment variables.');
        setCancellingBookingId(null);
        return;
      }
      
      const cancelUrl = `${apiUrl}/bookings/${bookingId}/cancel`;
      console.log("[LINE Bookings] Making cancel request to:", cancelUrl);
      
      const cancelRes = await fetch(cancelUrl, {
        method: 'POST',
        headers: cancelHeaders,
      });

      if (cancelRes.ok) {
        console.log("[LINE Bookings] ✅ Booking cancelled successfully");
        // Refresh bookings list immediately
        await loadBookings();
        alert('Booking cancelled successfully.');
      } else {
        const errorData = await cancelRes.json().catch(() => ({ error: 'Failed to cancel booking' }));
        console.error("[LINE Bookings] ❌ Cancel failed:", errorData);
        alert(`Failed to cancel booking: ${errorData.error || errorData.details || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("[LINE Bookings] ❌ Error cancelling booking:", error);
      alert(`Error: ${error?.message || 'Failed to cancel booking'}`);
    } finally {
      setCancellingBookingId(null);
    }
  };

  // PART 3: Message Shop handler - navigates to Inbox with preselected shop
  // STEP 1: Pass REAL shop context (shop_id, booking_id, authenticated user_id)
  const handleMessageShop = async (booking: Booking) => {
    console.log("[LINE Bookings] Send message clicked for booking:", booking.id);
    
    // Get shop data (handle both array and single object)
    const shopData = Array.isArray(booking.shops) ? booking.shops[0] : booking.shops;
    const shopId = booking.shop_id || shopData?.id;
    
    if (!shopId) {
      console.error("[LINE Bookings] ❌ No shop_id found for booking");
      alert('Shop information not available.');
      return;
    }

    // Get LINE user ID for customer_ref
    let lineUserId: string | null = null;
    if (typeof window !== "undefined" && window.liff) {
      try {
        const profile = await window.liff.getProfile();
        lineUserId = profile.userId;
        console.log("[LINE Bookings] ✅ Got LINE user ID:", lineUserId);
      } catch (error) {
        console.error("[LINE Bookings] ❌ Failed to get LINE user ID:", error);
        alert('Failed to identify user. Please try again.');
        return;
      }
    }

    if (!lineUserId) {
      console.error("[LINE Bookings] ❌ LINE user ID is missing");
      alert('LINE user identification failed. Please try again.');
      return;
    }

    // STEP 1: Navigate to Inbox page with shop_id, booking_id, and line_user_id
    // NO placeholders. NO generic "shop".
    const params = new URLSearchParams({
      shop_id: shopId,
      booking_id: booking.id,
      line_user_id: lineUserId,
    });
    const inboxUrl = `/line-app/inbox?${params.toString()}`;
    console.log("[LINE Bookings] Navigating to inbox with context:", {
      shop_id: shopId,
      booking_id: booking.id,
      line_user_id: lineUserId,
    });
    router.push(inboxUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const success = searchParams.get("success") === "true";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">✅ Booking confirmed successfully!</p>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-4">
            <p className="text-yellow-800 text-sm font-medium">⚠️ {error}</p>
          </div>
        )}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">You have no bookings yet.</p>
            <button
              onClick={() => router.push("/line-app")}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Search Shops
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {Array.isArray(booking.shops) ? booking.shops[0]?.name : booking.shops?.name || "Shop"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(booking.shops) ? booking.shops[0]?.address : booking.shops?.address || ""}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Service:</span> {Array.isArray(booking.services) ? booking.services[0]?.name : booking.services?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(booking.start_time).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Time:</span>{" "}
                    {new Date(booking.start_time).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewDetails(booking)}
                      disabled={viewingBookingId === booking.id}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {viewingBookingId === booking.id ? 'Loading...' : 'View Details'}
                    </button>
                    {booking.status === "pending" && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingBookingId === booking.id}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                  {/* TASK 4: Message Shop button - opens LINE chat */}
                  <button
                    onClick={() => handleMessageShop(booking)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    Message Shop
                  </button>
                  {/* PART 5: Review button */}
                  <button
                    onClick={() => {
                      const shopId = Array.isArray(booking.shops) ? booking.shops[0]?.id : booking.shops?.id || booking.shop_id;
                      if (shopId) {
                        setShowReviews(showReviews === shopId ? null : shopId);
                      }
                    }}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⭐</span>
                    {showReviews === (Array.isArray(booking.shops) ? booking.shops[0]?.id : booking.shops?.id || booking.shop_id) ? 'Hide Reviews' : 'Reviews'}
                  </button>
                </div>
                {/* PART 5: Reviews section */}
                {showReviews === (Array.isArray(booking.shops) ? booking.shops[0]?.id : booking.shops?.id || booking.shop_id) && (() => {
                  const shopId = Array.isArray(booking.shops) 
                    ? booking.shops[0]?.id 
                    : booking.shops?.id || booking.shop_id;
                  return shopId ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <ReviewsSection 
                        shopId={shopId}
                        lineUserId={lineUserId}
                      />
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LineBookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LineBookingsPageContent />
    </Suspense>
  );
}

