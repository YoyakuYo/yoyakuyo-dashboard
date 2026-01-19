"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useLineAppI18n } from "../../i18n";

export const dynamic = 'force-dynamic';

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

// Block external navigation in LIFF - use router.push only
if (typeof window !== "undefined") {
  const originalOpen = window.open;
  window.open = function(...args) {
    console.warn("Blocked window.open in LIFF app");
    return null;
  };
  
  // Prevent all full page reloads
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    get: () => originalLocation,
    set: () => {
      console.warn("Blocked window.location assignment in LIFF app");
    }
  });
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

function LineBookingPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLineAppI18n();
  const shopId = params.shopId as string;
  const serviceId = searchParams.get("service_id");
  
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [error, setError] = useState<string>("");

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

  // Initialize LIFF
  useEffect(() => {
    if (typeof window === "undefined" || !LIFF_ID) {
      // If no LIFF ID, allow the page to work anyway (for testing)
      setLiffInitialized(true);
      return;
    }

    const initLiff = async () => {
      try {
        // Load LIFF SDK if not already loaded
        if (!window.liff) {
          const script = document.createElement("script");
          script.src = "https://static.line-scdn.net/liff/edge/versions/2.24.0/sdk.js";
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
            document.body.appendChild(script);
          });
        }

        // Initialize LIFF
        await window.liff.init({ liffId: LIFF_ID });
        setLiffInitialized(true);

        // Check if in LINE client (optional - allow browser for testing)
        if (!window.liff.isInClient()) {
          console.warn("Not in LINE client - page may not work correctly");
        }

        // Verify login (optional - allow without login for testing)
        if (!window.liff.isLoggedIn()) {
          console.warn("Not logged in to LINE");
        }
      } catch (err: any) {
        console.error("LIFF initialization error:", err);
        // Don't block the page - allow it to work even if LIFF fails
        setLiffInitialized(true);
      }
    };

    initLiff();
  }, [LIFF_ID]);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    } else {
      // If no serviceId, show message
      setService(null);
    }
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate]);

  const fetchService = async () => {
    if (!serviceId) return;
    
    try {
      const res = await fetch(`${apiUrl}/services/${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setService(data);
      } else {
        console.error("Failed to fetch service:", res.status);
        setService(null);
      }
    } catch (error) {
      console.error("Error fetching service:", error);
      setService(null);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDate) {
      setTimeSlots([]);
      return;
    }

    setLoading(true);
    try {
      // Use the same endpoint as the main app
      const url = `${apiUrl}/shops/${shopId}/availability?date=${selectedDate}`;
      console.log("Fetching availability from:", url);
      
      const res = await fetch(url);
      console.log("Availability response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Availability response data:", data);
        
        // Map the response to match the expected format
        const slots = Array.isArray(data) ? data : [];
        setTimeSlots(slots);
        
        // Log for debugging
        if (slots.length === 0) {
          console.warn("No timeslots returned for date:", selectedDate, "shopId:", shopId);
          console.warn("This might mean:");
          console.warn("1. Shop is closed on this date (holiday)");
          console.warn("2. Shop has no services");
          console.warn("3. Shop has services but no timeslots generated");
          console.warn("4. All timeslots are already booked");
        } else {
          console.log(`✅ Found ${slots.length} timeslots for date:`, selectedDate);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to fetch availability" }));
        console.error("❌ Failed to fetch availability:", res.status, errorData);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("❌ Error fetching time slots:", error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ENFORCE service selection
    if (!serviceId || !service) {
      alert("Please select a service to book an appointment");
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time");
      return;
    }

    setSubmitting(true);
    try {
      // Get LINE user ID, display name, and canonical user_id from LIFF
      let lineUserId = "";
      let lineDisplayName = "";
      let canonicalUserId: string | undefined = undefined;
      
      if (typeof window !== "undefined" && window.liff) {
        try {
          const profile = await window.liff.getProfile();
          lineUserId = profile.userId;
          lineDisplayName = profile.displayName || "";
          
          // CRITICAL: Get ID token and canonical user_id
          try {
            const idToken = await window.liff.getIDToken();
            if (idToken) {
              const verifyResponse = await fetch(`${apiUrl}/api/line/liff/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: idToken }),
              });
              
              if (verifyResponse.ok) {
                const userData = await verifyResponse.json();
                canonicalUserId = userData.user_id;
                console.log("[LINE Booking] ✅ Canonical user_id:", canonicalUserId);
                // Persist JWT for authenticated LINE calls (bookings/messages/etc.)
                if (userData.supabase_jwt) {
                  try {
                    sessionStorage.setItem('supabase_jwt', userData.supabase_jwt);
                  } catch {
                    // ignore storage failures
                  }
                }
              }
            }
          } catch (tokenError) {
            console.warn("[LINE Booking] ⚠️ Could not get ID token:", tokenError);
          }
          
          // Also check sessionStorage for canonical user_id (set during LIFF init)
          if (!canonicalUserId) {
            canonicalUserId = sessionStorage.getItem('canonical_user_id') || undefined;
          }
          
          console.log("[LINE Booking] LINE User ID:", lineUserId);
          console.log("[LINE Booking] LINE Display Name:", lineDisplayName);
          console.log("[LINE Booking] Canonical User ID:", canonicalUserId);
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
        alert("Please select a valid time slot.");
        setSubmitting(false);
        return;
      }

      // Use the timeslot's start_time and end_time directly
      const startDateTime = new Date(`${selectedDate}T${selectedSlot.start_time}`);
      const endDateTime = new Date(`${selectedDate}T${selectedSlot.end_time}`);

      // Use the same booking endpoint format as the main app
      const supabaseJwt =
        (typeof window !== "undefined" ? sessionStorage.getItem("supabase_jwt") : null) || null;
      const res = await fetch(`${apiUrl}/api/line/bookings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-line-user-id": lineUserId,
          "x-canonical-user-id": canonicalUserId || "", // CRITICAL: Pass canonical user_id
          ...(supabaseJwt ? { Authorization: `Bearer ${supabaseJwt}` } : {}),
        },
        body: JSON.stringify({
          ...(lineUserId ? { line_user_id: lineUserId, channel: 'line' } : { channel: 'guest' }),
          line_display_name: lineDisplayName, // Send display name from LIFF
          shop_id: shopId,
          service_id: serviceId, // REQUIRED - service selection enforced
          date: selectedDate,
          time: selectedTime,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          time_slot: `${selectedSlot.start_time}-${selectedSlot.end_time}`,
        }),
      });

      if (res.ok) {
        // BUG 1 FIX: After booking success, immediately fetch bookings using ID token
        // This ensures the new booking appears without refresh
        try {
          if (typeof window !== "undefined" && window.liff) {
            const idToken = await window.liff.getIDToken();
            if (idToken) {
              // Trigger bookings refresh by navigating with success flag
              // The bookings page will use the ID token endpoint
              router.push(`/line-app/bookings?success=true&refresh=${Date.now()}`);
            } else {
              router.push(`/line-app/bookings?success=true`);
            }
          } else {
            router.push(`/line-app/bookings?success=true`);
          }
        } catch (idTokenError) {
          console.error("[LINE Booking] Failed to get ID token for refresh:", idTokenError);
          router.push(`/line-app/bookings?success=true`);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to create booking" }));
        alert(errorData.error || "Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("An error occurred. Please try again.");
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

  // Debug logging
  useEffect(() => {
    console.log("LineBookingPage - shopId:", shopId, "serviceId:", serviceId);
    console.log("LineBookingPage - liffInitialized:", liffInitialized);
  }, [shopId, serviceId, liffInitialized]);

  // Show loading while LIFF initializes (but allow page to render if LIFF_ID is not set)
  if (!liffInitialized && LIFF_ID) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Show error if shopId is missing
  if (!shopId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Shop</h1>
          <p className="text-gray-600 mb-4">Shop ID is missing. Please go back and try again.</p>
          <button
            onClick={() => router.push("/line-app")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← {t("back")}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t("bookAppointment")}</h1>
        </div>

        {service ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h2>
            <p className="text-gray-600">{t("durationLabel")}: {service.duration} {t("minutes")}</p>
            {service.price && (
              <p className="text-gray-900 font-bold mt-2">{t("priceLabel")}: ¥{service.price}</p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 mb-6">
            <p className="text-yellow-800 text-sm font-medium">
              {serviceId ? "Loading service details..." : "Please select a service to book an appointment."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("selectDate")}
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("chooseDate")}</option>
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

          {/* Time Selection */}
          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("selectTime")}
              </label>
              {loading ? (
                <p className="text-gray-600">{t("loadingTimes")}</p>
              ) : timeSlots.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-600">{t("noAvailableTimes")}</p>
                  <p className="text-gray-500 text-sm">
                    This shop may be closed on this date, or all timeslots are booked. Please try another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    // Extract time from start_time (format: "HH:MM" or "HH:MM:SS")
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
            disabled={!selectedDate || !selectedTime || submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? t("bookingSubmitting") : t("confirmBooking")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LineBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{/* shell handles locale */}Loading...</p>
        </div>
      </div>
    }>
      <LineBookingPageContent />
    </Suspense>
  );
}

