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
  shops: { name: string; address?: string } | Array<{ name: string; address?: string }>;
  services: { name: string; price?: number; duration_minutes?: number } | Array<{ name: string; price?: number; duration_minutes?: number }>;
}

function LineBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineUserId, setLineUserId] = useState<string>("");
  const [error, setError] = useState<string>("");

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

  // Reload bookings when success parameter changes
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      // Reload bookings after a delay to ensure backend has processed the booking
      // Increased delay to 2 seconds to allow database transaction to commit
      setTimeout(() => {
        console.log("[LINE Bookings] Reloading bookings after successful booking creation...");
        loadBookings();
      }, 2000);
    }
  }, [searchParams]);

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

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  {booking.status === "pending" && (
                    <button className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                      Cancel
                    </button>
                  )}
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

