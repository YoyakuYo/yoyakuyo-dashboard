"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/apiClient";

export const dynamic = 'force-dynamic';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  shops: { name: string; address?: string };
  services: { name: string };
}

export default function LineBookingsPage() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineUserId, setLineUserId] = useState<string>("");

  useEffect(() => {
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
            
            // Fetch bookings
            const bookingsRes = await fetch(
              `${apiUrl}/api/customer/bookings?customer_profile_id=${userData.id}`
            );

            if (bookingsRes.ok) {
              const bookingsData = await bookingsRes.json();
              setBookings(bookingsData.bookings || []);
            }
          }
        } catch (error) {
          console.error("Error loading bookings:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

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

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">You have no bookings yet.</p>
            <Link
              href="/line-app"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Search Shops
            </Link>
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
                      {booking.shops?.name || "Shop"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.shops?.address || ""}
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
                    <span className="font-medium">Service:</span> {booking.services?.name || "N/A"}
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

