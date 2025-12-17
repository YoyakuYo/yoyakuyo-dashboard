"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

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

  // PART 3: Message Shop handler - opens internal messaging page (NOT LINE chat)
  const handleMessageShop = async (booking: Booking) => {
    console.log("[LINE Bookings] Message Shop clicked for booking:", booking.id);
    
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
      } catch (error) {
        console.error("[LINE Bookings] Failed to get LINE user ID:", error);
        alert('Failed to identify user. Please try again.');
        return;
      }
    }

    if (!lineUserId) {
      alert('LINE user identification failed. Please try again.');
      return;
    }

    // PART 1.3: Create or get conversation first, then redirect with conversation_id
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';
      const idToken = await window.liff.getIDToken();
      
      // Create or get conversation
      const convRes = await fetch(`${apiUrl}/api/internal-messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-user-id': lineUserId,
          'x-id-token': idToken,
        },
        body: JSON.stringify({
          shop_id: shopId,
          booking_id: booking.id || null,
          customer_type: 'line',
          customer_ref: lineUserId, // PART 1.1: Normalize using line_user_id
        }),
      });
      
      if (!convRes.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const convData = await convRes.json();
      const conversationId = convData.conversation_id;
      
      // Build internal messaging URL with conversation_id
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const messagesUrl = `${appUrl}/messages?conversation_id=${conversationId}`;
      
      console.log("[LINE Bookings] Opening internal messaging:", messagesUrl);
      
      // Open internal messaging page in LIFF (not external)
      if (typeof window !== "undefined" && window.liff) {
        try {
          window.liff.openWindow({
            url: messagesUrl,
            external: false, // Open inside LIFF (leaf)
          });
        } catch (openError) {
          console.error("[LINE Bookings] Failed to open messaging page:", openError);
          // Fallback: navigate in same window
          window.location.href = messagesUrl;
        }
      } else {
        // Fallback for non-LIFF environments
        window.location.href = messagesUrl;
      }
    } catch (error) {
      console.error("[LINE Bookings] Error creating conversation:", error);
      alert('Failed to start conversation. Please try again.');
    }
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
                </div>
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

