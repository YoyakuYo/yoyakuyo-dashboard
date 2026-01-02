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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("common.refresh")}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare growth chart data (include admins in total)
  const growthChartData = stats.growth.map((day) => ({
    x: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    y: (day.admins || 0) + day.owners + day.customers,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("admin.dashboard")}
        </h1>
        <p className="text-gray-600">{t("admin.platformOverview")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title={t("admin.totalUsers")}
          value={(stats.totals.admins || 0) + (stats.totals.owners || 0) + (stats.totals.customers || 0)}
          subtitle={`${stats.totals.admins || 0} ${t("admin.admins") || "Admins"}, ${stats.totals.owners || 0} ${t("admin.owners")}, ${stats.totals.customers || 0} ${t("admin.customers")}`}
          icon="👥"
          trend={{
            value: (stats.recent.admins || 0) + (stats.recent.owners || 0) + (stats.recent.customers || 0),
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalShops")}
          value={stats.totals.shops || 0}
          icon="🏪"
          trend={{
            value: stats.recent.shops || 0,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalBookings")}
          value={stats.totals.bookings || 0}
          icon="📅"
          trend={{
            value: stats.recent.bookings || 0,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalRevenue")}
          value={formatCurrency(stats.totals.revenue || 0)}
          icon="💰"
        />
      </div>

      {/* Growth Chart */}
      {stats.growth.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("admin.userGrowth")}
          </h2>
          <LineChart data={growthChartData} height={300} color="#3B82F6" />
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
              {stats.recent.admins || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newOwners")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.owners || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newCustomers")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.customers || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newShops")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.shops || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newBookings")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.bookings || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

