"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch bookings to calculate stats
      const bookingsRes = await fetch(`${apiUrl}/bookings`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        const bookingsArray = Array.isArray(bookings) ? bookings : [];

        // Calculate stats
        const totalBookings = bookingsArray.length;
        const pendingBookings = bookingsArray.filter((b: any) => b.status === 'pending').length;
        const confirmedBookings = bookingsArray.filter((b: any) => b.status === 'confirmed').length;
        const completedBookings = bookingsArray.filter((b: any) => b.status === 'completed').length;
        const cancelledBookings = bookingsArray.filter((b: any) => b.status === 'cancelled').length;

        setStats({
          totalBookings,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings,
        });
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Confirmed</h3>
            <p className="text-3xl font-bold text-green-600">{stats.confirmedBookings}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.completedBookings}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">No analytics data available.</p>
        </div>
      )}
    </div>
  );
}

