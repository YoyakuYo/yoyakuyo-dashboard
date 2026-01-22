// Admin dashboard main page
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import AdminStatsCard from "@/app/components/admin/AdminStatsCard";
import LineChart from "@/app/components/LineChart";

interface PlatformStats {
  totals: {
    admins: number; // Admins from admins table
    owners: number;
    customers: number;
    shops: number;
    bookings: number;
    revenue: number;
  };
  recent: {
    admins: number;
    owners: number;
    customers: number;
    shops: number;
    bookings: number;
  };
  growth: Array<{
    date: string;
    admins: number;
    owners: number;
    customers: number;
  }>;
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Get user from Supabase Auth
  useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      return;
    }

    // If user hasn't changed, don't reload
    if (userId === lastUserIdRef.current && lastUserIdRef.current !== null) {
      return;
    }

    if (userId) {
      lastUserIdRef.current = userId;
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("Admin access required");
        } else {
          setError("Failed to load stats");
        }
        return;
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error("Error loading admin stats:", err);
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Default stats if not loaded yet
  const defaultStats: PlatformStats = {
    totals: {
      admins: 0,
      owners: 0,
      customers: 0,
      shops: 0,
      bookings: 0,
      revenue: 0,
    },
    recent: {
      admins: 0,
      owners: 0,
      customers: 0,
      shops: 0,
      bookings: 0,
    },
    growth: [],
  };

  const displayStats = stats || defaultStats;

  // Prepare growth chart data (include admins in total)
  const growthChartData = displayStats.growth.map((day) => ({
    x: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    y: (day.admins || 0) + day.owners + day.customers,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("admin.dashboard")}
          </h1>
          <p className="text-gray-600">{t("admin.platformOverview")}</p>
        </div>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t("common.refresh") || "Refresh"}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title={t("admin.totalUsers")}
          value={(displayStats.totals.admins || 0) + (displayStats.totals.owners || 0) + (displayStats.totals.customers || 0)}
          subtitle={`${displayStats.totals.admins || 0} ${t("admin.admins") || "Admins"}, ${displayStats.totals.owners || 0} ${t("admin.owners")}, ${displayStats.totals.customers || 0} ${t("admin.customers")}`}
          icon="👥"
          trend={{
            value: (displayStats.recent.admins || 0) + (displayStats.recent.owners || 0) + (displayStats.recent.customers || 0),
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalShops")}
          value={displayStats.totals.shops || 0}
          icon="🏪"
          trend={{
            value: displayStats.recent.shops || 0,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalBookings")}
          value={displayStats.totals.bookings || 0}
          icon="📅"
          trend={{
            value: displayStats.recent.bookings || 0,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalRevenue")}
          value={formatCurrency(displayStats.totals.revenue || 0)}
          icon="💰"
        />
      </div>

      {/* Growth Chart */}
      {displayStats.growth.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("admin.userGrowth")}
          </h2>
          <LineChart data={growthChartData} height={300} color="#3B82F6" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("admin.userGrowth")}
          </h2>
          <div className="text-center py-12 text-gray-500">
            <p>{t("admin.noGrowthData") || "No growth data available yet"}</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t("admin.recentActivity")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600">{t("admin.newAdmins") || "New Admins"}</p>
            <p className="text-2xl font-bold text-gray-900">
              {displayStats.recent.admins || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newOwners")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {displayStats.recent.owners || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newCustomers")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {displayStats.recent.customers || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newShops")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {displayStats.recent.shops || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newBookings")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {displayStats.recent.bookings || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

