"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const t = useTranslations();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    favoriteShops: 0,
    unreadNotifications: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    const supabase = getSupabaseClient();
    
    // Load stats
    const [bookingsRes, favoritesRes, notificationsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, status, booking_date, booking_time", { count: "exact" })
        .eq("customer_profile_id", user?.id)
        .order("booking_date", { ascending: false })
        .limit(5),
      supabase
        .from("customer_favorites")
        .select("id", { count: "exact" })
        .eq("customer_id", user?.id),
      supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("recipient_type", "customer")
        .eq("recipient_id", user?.id)
        .eq("is_read", false),
    ]);

    const bookings = bookingsRes.data || [];
    const totalBookings = bookingsRes.count || 0;
    const upcomingBookings = bookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed"
    ).length;
    const favoriteShops = favoritesRes.count || 0;
    const unreadNotifications = notificationsRes.count || 0;

    setStats({
      totalBookings,
      upcomingBookings,
      favoriteShops,
      unreadNotifications,
    });
    setRecentBookings(bookings);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/customer/bookings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
        </Link>
        <Link
          href="/customer/bookings?filter=upcoming"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-sm text-gray-600 mb-1">Upcoming</div>
          <div className="text-3xl font-bold text-blue-600">{stats.upcomingBookings}</div>
        </Link>
        <Link
          href="/customer/favorites"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-sm text-gray-600 mb-1">Favorite Shops</div>
          <div className="text-3xl font-bold text-pink-600">{stats.favoriteShops}</div>
        </Link>
        <Link
          href="/customer/notifications"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-sm text-gray-600 mb-1">Notifications</div>
          <div className="text-3xl font-bold text-red-600">{stats.unreadNotifications}</div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <Link
            href="/customer/bookings"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No bookings yet.{" "}
            <Link href="/customer/shops" className="text-blue-600 hover:underline">
              Browse shops
            </Link>{" "}
            to make your first booking!
          </p>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: <span className="capitalize">{booking.status}</span>
                  </div>
                </div>
                <Link
                  href={`/customer/bookings/${booking.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/customer/shops"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">Browse Shops</h3>
          <p className="text-blue-100 text-sm">Discover and book appointments</p>
        </Link>
        <Link
          href="/customer/chat"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
          <p className="text-purple-100 text-sm">Get help with bookings</p>
        </Link>
        <Link
          href="/customer/favorites"
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">My Favorites</h3>
          <p className="text-pink-100 text-sm">View saved shops</p>
        </Link>
      </div>
    </div>
  );
}

