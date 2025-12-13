"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

export const dynamic = 'force-dynamic';

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

export default function LineBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const serviceId = searchParams.get("service_id");
  
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchService();
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
    try {
      const res = await fetch(`${apiUrl}/services/${serviceId}`);
      if (res.ok) {
        const data = await res.json();
        setService(data);
      }
    } catch (error) {
      console.error("Error fetching service:", error);
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
      // Get LINE user ID from LIFF
      let lineUserId = "";
      if (typeof window !== "undefined" && window.liff) {
        const profile = await window.liff.getProfile();
        lineUserId = profile.userId;
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
      const res = await fetch(`${apiUrl}/api/line/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_user_id: lineUserId,
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
        router.push(`/line-app/bookings?success=true`);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h1>

        {service ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h2>
            <p className="text-gray-600">Duration: {service.duration} minutes</p>
            {service.price && (
              <p className="text-gray-900 font-bold mt-2">Price: ¥{service.price}</p>
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
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* Time Selection */}
          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time
              </label>
              {loading ? (
                <p className="text-gray-600">Loading available times...</p>
              ) : timeSlots.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-600">No available times for this date</p>
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
            {submitting ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

