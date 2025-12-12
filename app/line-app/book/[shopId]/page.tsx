"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
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
    if (selectedDate && serviceId) {
      fetchTimeSlots();
    }
  }, [selectedDate, serviceId]);

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
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/timeslots?shop_id=${shopId}&date=${selectedDate}&service_id=${serviceId}`
      );
      if (res.ok) {
        const data = await res.json();
        setTimeSlots(data.timeSlots || []);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !serviceId) return;

    setSubmitting(true);
    try {
      // Get LINE user ID from LIFF
      let lineUserId = "";
      if (typeof window !== "undefined" && window.liff) {
        const profile = await window.liff.getProfile();
        lineUserId = profile.userId;
      }

      const res = await fetch(`${apiUrl}/api/line/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_user_id: lineUserId,
          shop_id: shopId,
          service_id: serviceId,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      if (res.ok) {
        router.push(`/line-app/bookings?success=true`);
      } else {
        alert("Failed to create booking. Please try again.");
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

        {service && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h2>
            <p className="text-gray-600">Duration: {service.duration} minutes</p>
            {service.price && (
              <p className="text-gray-900 font-bold mt-2">Price: ¥{service.price}</p>
            )}
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
                <p className="text-gray-600">No available times for this date</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedTime === slot.time
                          ? "bg-blue-600 text-white"
                          : slot.available
                          ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
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

