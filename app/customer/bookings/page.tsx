"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, filter]);

  const loadBookings = async () => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("bookings")
      .select(`
        *,
        shops (
          id,
          name,
          address,
          phone
        )
      `)
      .eq("customer_profile_id", user?.id)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });

    if (filter !== "all") {
      if (filter === "upcoming") {
        query = query.in("status", ["pending", "confirmed"]);
      } else {
        query = query.eq("status", filter);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading bookings:", error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {["all", "upcoming", "pending", "confirmed", "cancelled", "completed"].map((f) => (
          <Link
            key={f}
            href={`/customer/bookings?filter=${f}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Link>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No bookings found.</p>
          <Link
            href="/customer/shops"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse shops to make a booking →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.shops?.name || "Unknown Shop"}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong> {booking.booking_time}
                    </p>
                    {booking.shops?.address && (
                      <p>
                        <strong>Location:</strong> {booking.shops.address}
                      </p>
                    )}
                    {booking.customer_name && (
                      <p>
                        <strong>Name:</strong> {booking.customer_name}
                      </p>
                    )}
                    {booking.customer_phone && (
                      <p>
                        <strong>Phone:</strong> {booking.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/customer/bookings/${booking.id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

