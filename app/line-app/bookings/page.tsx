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
    // Get LINE user ID from LIFF
    if (typeof window !== "undefined" && window.liff) {
      try {
        const profile = await window.liff.getProfile();
        setLineUserId(profile.userId);

        // Fetch user profile to get customer_profile_id
        const userRes = await fetch(`${apiUrl}/api/line/user`, {
          headers: { "x-line-user-id": profile.userId },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          
          // Fetch bookings using LINE bookings endpoint (direct query by line_user_id)
          let bookingsData = [];
          
          // Use LINE bookings endpoint which queries via line_bookings table
          console.log(`[LINE Bookings Frontend] 📤 Calling API: ${apiUrl}/api/line/bookings?line_user_id=${profile.userId}`);
          console.log(`[LINE Bookings Frontend] 📤 API URL env:`, process.env.NEXT_PUBLIC_API_URL);
          
          let bookingsRes;
          try {
            bookingsRes = await fetch(
              `${apiUrl}/api/line/bookings?line_user_id=${profile.userId}`,
              {
                headers: {
                  'x-line-user-id': profile.userId,
                },
                // Add timeout and better error handling
                signal: AbortSignal.timeout(30000), // 30 second timeout
              }
            );
            console.log(`[LINE Bookings Frontend] ✅ API responded with status: ${bookingsRes.status}`);
          } catch (fetchError: any) {
            console.error(`[LINE Bookings Frontend] ❌ Fetch failed:`, fetchError);
            console.error(`[LINE Bookings Frontend] ❌ Error name:`, fetchError?.name);
            console.error(`[LINE Bookings Frontend] ❌ Error message:`, fetchError?.message);
            
            // Check if it's a network error
            if (fetchError?.name === 'AbortError' || fetchError?.message?.includes('timeout')) {
              setError(`Request timed out. The API might be slow or unavailable.`);
            } else if (fetchError?.message?.includes('Failed to fetch') || fetchError?.message?.includes('NetworkError')) {
              setError(`Cannot reach the API server. Please check your internet connection or try again later.`);
            } else {
              setError(`Network error: ${fetchError?.message || 'Unknown error'}`);
            }
            
            // Try fallback
            bookingsRes = null;
          }
          
          if (!bookingsRes) {
            // Fallback to direct Supabase query
            console.log(`[LINE Bookings Frontend] 🔄 Attempting direct Supabase query as fallback...`);
            try {
              const { getSupabaseClient } = await import('@/lib/supabaseClient');
              const supabase = getSupabaseClient();
              
              const { data: lineAccount } = await supabase
                .from('line_accounts')
                .select('customer_id')
                .eq('line_user_id', profile.userId)
                .maybeSingle();
              
              if (lineAccount?.customer_id) {
                const { data: directBookings, error: directError } = await supabase
                  .from('bookings')
                  .select(`
                    *,
                    shops:shop_id (id, name, address, phone),
                    services:service_id (id, name, price, duration_minutes)
                  `)
                  .eq('customer_id', lineAccount.customer_id)
                  .eq('source', 'line')
                  .order('created_at', { ascending: false });
                
                if (!directError && directBookings) {
                  setBookings(directBookings);
                  setError("");
                  setLoading(false);
                  return;
                }
              }
            } catch (supabaseError: any) {
              console.error(`[LINE Bookings Frontend] ❌ Supabase fallback failed:`, supabaseError);
            }
            
            setLoading(false);
            return;
          }

          if (bookingsRes.ok) {
            let data;
            try {
              const responseText = await bookingsRes.text();
              console.log(`[LINE Bookings] Raw API response:`, responseText.substring(0, 500));
              
              if (!responseText || responseText.trim() === '') {
                console.warn(`[LINE Bookings] ⚠️ API returned empty response`);
                bookingsData = [];
              } else {
                data = JSON.parse(responseText);
                // Handle both response formats: { bookings: [...] } or direct array
                bookingsData = Array.isArray(data) ? data : (data.bookings || []);
              }
            } catch (parseError) {
              console.error(`[LINE Bookings] ❌ Failed to parse API response:`, parseError);
              bookingsData = [];
            }
            
            console.log(`[LINE Bookings] ✅ API returned ${bookingsData.length} bookings for LINE user ${profile.userId}`);
            console.log(`[LINE Bookings] API URL used: ${apiUrl}`);
            console.log(`[LINE Bookings] Response data type:`, Array.isArray(data) ? 'array' : typeof data);
            console.log(`[LINE Bookings] First booking (if any):`, bookingsData[0]);
            
            if (bookingsData.length === 0) {
              console.warn(`[LINE Bookings] ⚠️ API returned 0 bookings. This might mean:`);
              console.warn(`[LINE Bookings] 1. The booking was just created and hasn't been committed yet`);
              console.warn(`[LINE Bookings] 2. The API is pointing to production (Render) which hasn't deployed the fix yet`);
              console.warn(`[LINE Bookings] 3. Check if NEXT_PUBLIC_API_URL is set correctly`);
            }
            
            // DEBUG: Verify bookings have required fields
            if (bookingsData.length > 0) {
              bookingsData.forEach((booking: any, index: number) => {
                console.log(`[LINE Bookings] Booking ${index}:`, {
                  id: booking.id,
                  customer_id: booking.customer_id,
                  source: booking.source,
                  booking_type: booking.booking_type, // Legacy
                  line_user_id: booking.line_user_id, // Legacy
                  shop: booking.shops?.name || (Array.isArray(booking.shops) ? booking.shops[0]?.name : 'N/A'),
                  service: booking.services?.name || (Array.isArray(booking.services) ? booking.services[0]?.name : 'N/A'),
                });
              });
            }
          } else {
            const errorText = await bookingsRes.text();
            console.error(`[LINE Bookings] ❌ Failed to fetch LINE bookings:`, bookingsRes.status, errorText);
            console.error(`[LINE Bookings] API URL: ${apiUrl}`);
            console.error(`[LINE Bookings] Endpoint: ${apiUrl}/api/line/bookings?line_user_id=${profile.userId}`);
            
            // Check if error is the duration column issue
            if (errorText.includes('duration') || errorText.includes('column services')) {
              const errorMsg = `API Error: Production API needs update. Using fallback query...`;
              console.error(`[LINE Bookings] ⚠️ CRITICAL: API is still using old code with 'duration' column bug.`);
              console.error(`[LINE Bookings] ⚠️ The production API (Render) needs to be deployed with the fix.`);
              console.error(`[LINE Bookings] ⚠️ Fix: Changed services.duration to services.duration_minutes`);
              setError(errorMsg);
            } else {
              setError(`Failed to load bookings (${bookingsRes.status}). Trying fallback...`);
            }
            
            // Fallback: try customer bookings history endpoint
            if (userData.id) {
              console.log(`[LINE Bookings] Trying fallback endpoint with user_id: ${userData.id}`);
              const fallbackRes = await fetch(
                `${apiUrl}/api/customer/bookings/history`,
                {
                  headers: {
                    'x-user-id': userData.id,
                  }
                }
              );
              
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                bookingsData = fallbackData.bookings || fallbackData || [];
                console.log(`[LINE Bookings] ✅ Fallback loaded ${bookingsData.length} bookings`);
                setError(""); // Clear error on success
              } else {
                const fallbackError = await fallbackRes.text();
                console.error(`[LINE Bookings] ❌ Fallback also failed:`, fallbackError);
                
                // Last resort: Try direct Supabase query via frontend
                console.log(`[LINE Bookings] Attempting direct Supabase query as last resort...`);
                setError("API unavailable. Trying direct database query...");
                try {
                  const { getSupabaseClient } = await import('@/lib/supabaseClient');
                  const supabase = getSupabaseClient();
                  
                  // Get customer_id from line_accounts first
                  const { data: lineAccount } = await supabase
                    .from('line_accounts')
                    .select('customer_id')
                    .eq('line_user_id', profile.userId)
                    .single();
                  
                  if (!lineAccount?.customer_id) {
                    console.error(`[LINE Bookings] ❌ No line_account found for line_user_id: ${profile.userId}`);
                    setError(`No account found for LINE user. Please try again.`);
                    return;
                  }
                  
                  const { data: directBookings, error: directError } = await supabase
                    .from('bookings')
                    .select(`
                      *,
                      shops:shop_id (id, name, address, phone),
                      services:service_id (id, name, price, duration_minutes)
                    `)
                    .eq('customer_id', lineAccount.customer_id)
                    .eq('source', 'line')
                    .order('created_at', { ascending: false });
                  
                  if (!directError && directBookings) {
                    bookingsData = directBookings;
                    console.log(`[LINE Bookings] ✅ Direct Supabase query loaded ${bookingsData.length} bookings`);
                    setError(""); // Clear error on success
                  } else {
                    console.error(`[LINE Bookings] ❌ Direct Supabase query failed:`, directError);
                    setError(`Database query failed: ${directError?.message || 'Unknown error'}`);
                  }
                } catch (supabaseError: any) {
                  console.error(`[LINE Bookings] ❌ Direct Supabase query error:`, supabaseError);
                  setError(`Query error: ${supabaseError?.message || 'Unknown error'}`);
                }
              }
            }
          }
          
          setBookings(bookingsData);
          
          // Clear error if we got bookings
          if (bookingsData.length > 0) {
            setError("");
          } else if (!error) {
            // Only set error if we didn't already set one above
            setError("No bookings found. If you just created a booking, wait a few seconds and refresh.");
          }
        }
      } catch (error: any) {
        console.error("Error loading bookings:", error);
        setError(`Error: ${error?.message || 'Failed to load bookings'}`);
      } finally {
        setLoading(false);
      }
    } else {
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

