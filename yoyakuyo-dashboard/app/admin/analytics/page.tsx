// Admin analytics & reports page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import LineChart from "@/app/components/LineChart";

interface RevenueData {
  totalRevenue: number;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
  }>;
}

interface UserGrowthData {
  growthByDate: Array<{
    date: string;
    admins: number;
    owners: number;
    customers: number;
  }>;
}

interface ShopPerformance {
  shops: Array<{
    shopId: string;
    shopName: string;
    isVerified: boolean;
    totalBookings: number;
    completedBookings: number;
    revenue: number;
  }>;
}

interface BookingTrends {
  statusCounts: Record<string, number>;
  dailyTrends: Array<{
    date: string;
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData | null>(null);
  const [shopPerformance, setShopPerformance] = useState<ShopPerformance | null>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrends | null>(null);
  const [period, setPeriod] = useState("monthly");
  const [exporting, setExporting] = useState(false);

  // Get user from Supabase Auth
  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error("Error getting user session:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadAllAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, period]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [revenueRes, usersRes, shopsRes, bookingsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/analytics/revenue?period=${period}`, {
          headers: {
            "x-user-id": userId || "",
            "Content-Type": "application/json",
          },
        }),
        fetch(`${apiUrl}/admin/analytics/users?days=30`, {
          headers: {
            "x-user-id": userId || "",
            "Content-Type": "application/json",
          },
        }),
        fetch(`${apiUrl}/admin/analytics/shops`, {
          headers: {
            "x-user-id": userId || "",
            "Content-Type": "application/json",
          },
        }),
        fetch(`${apiUrl}/admin/bookings/analytics`, {
          headers: {
            "x-user-id": userId || "",
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (revenueRes.ok) {
        const revenue = await revenueRes.json();
        setRevenueData(revenue);
      }

      if (usersRes.ok) {
        const users = await usersRes.json();
        setUserGrowthData(users);
      }

      if (shopsRes.ok) {
        const shops = await shopsRes.json();
        setShopPerformance(shops);
      }

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        setBookingTrends(bookings);
      }
    } catch (error: any) {
      console.error("Error loading analytics:", error);
      setError(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      // For now, just show a message. Actual export can be implemented later
      alert(t("admin.exportComingSoon") || "Export functionality coming soon");
    } catch (error: any) {
      console.error("Error exporting:", error);
      alert(error.message || (t("admin.exportFailed") || "Failed to export"));
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    router.push("/admin/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = revenueData?.revenueByPeriod.map((item) => ({
    x: item.period,
    y: item.revenue,
  })) || [];

  const userGrowthChartData = userGrowthData?.growthByDate.map((item) => ({
    x: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    y: item.admins + item.owners + item.customers,
  })) || [];

  const bookingTrendsChartData = bookingTrends?.dailyTrends.map((item) => ({
    x: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    y: item.total,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("admin.analytics") || "Analytics & Reports"}
          </h1>
          <p className="text-gray-600">{t("admin.analyticsDesc") || "Platform analytics and performance metrics"}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="daily">{t("admin.daily") || "Daily"}</option>
            <option value="weekly">{t("admin.weekly") || "Weekly"}</option>
            <option value="monthly">{t("admin.monthly") || "Monthly"}</option>
          </select>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {t("admin.exportCSV") || "Export CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadAllAnalytics}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t("common.refresh") || "Refresh"}
          </button>
        </div>
      )}

      {/* Revenue Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("admin.revenue") || "Revenue"}
        </h2>
        <div className="mb-4">
          <p className="text-3xl font-bold text-gray-900">
            {revenueData ? formatCurrency(revenueData.totalRevenue) : "¥0"}
          </p>
          <p className="text-sm text-gray-600">{t("admin.totalRevenue") || "Total Revenue"}</p>
        </div>
        {revenueChartData.length > 0 && (
          <LineChart data={revenueChartData} height={300} color="#10B981" />
        )}
      </div>

      {/* User Growth Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("admin.userGrowth") || "User Growth"}
        </h2>
        {userGrowthChartData.length > 0 && (
          <LineChart data={userGrowthChartData} height={300} color="#3B82F6" />
        )}
      </div>

      {/* Booking Trends Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("admin.bookingTrends") || "Booking Trends"}
        </h2>
        {bookingTrends && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">{t("admin.total") || "Total"}</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(bookingTrends.statusCounts).reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("bookings.confirmed") || "Confirmed"}</p>
              <p className="text-2xl font-bold text-green-600">
                {bookingTrends.statusCounts.confirmed || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("bookings.completed") || "Completed"}</p>
              <p className="text-2xl font-bold text-blue-600">
                {bookingTrends.statusCounts.completed || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("bookings.cancelled") || "Cancelled"}</p>
              <p className="text-2xl font-bold text-red-600">
                {bookingTrends.statusCounts.cancelled || 0}
              </p>
            </div>
          </div>
        )}
        {bookingTrendsChartData.length > 0 && (
          <LineChart data={bookingTrendsChartData} height={300} color="#8B5CF6" />
        )}
      </div>

      {/* Shop Performance Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("admin.shopPerformance") || "Shop Performance"}
        </h2>
        {shopPerformance && shopPerformance.shops.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.shopName") || "Shop Name"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.totalBookings") || "Total Bookings"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.completedBookings") || "Completed"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.revenue") || "Revenue"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shopPerformance.shops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {shop.shopName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shop.totalBookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shop.completedBookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(shop.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">{t("admin.noShopData") || "No shop performance data available"}</p>
        )}
      </div>
    </div>
  );
}

