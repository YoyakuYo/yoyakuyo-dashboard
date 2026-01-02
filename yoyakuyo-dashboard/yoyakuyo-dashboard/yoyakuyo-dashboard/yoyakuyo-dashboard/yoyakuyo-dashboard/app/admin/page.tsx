// Admin dashboard main page
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { useAuth } from "@/lib/useAuth";
import AdminStatsCard from "@/app/components/admin/AdminStatsCard";
import LineChart from "@/app/components/LineChart";

interface PlatformStats {
  totals: {
    owners: number;
    customers: number;
    shops: number;
    bookings: number;
    revenue: number;
  };
  recent: {
    owners: number;
    customers: number;
    shops: number;
    bookings: number;
  };
  growth: Array<{
    date: string;
    owners: number;
    customers: number;
  }>;
}

export default function AdminDashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          "x-user-id": user?.id || "",
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

  // Prepare growth chart data
  const growthChartData = stats.growth.map((day) => ({
    x: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    y: day.owners + day.customers,
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
          value={stats.totals.owners + stats.totals.customers}
          subtitle={`${stats.totals.owners} ${t("admin.owners")}, ${stats.totals.customers} ${t("admin.customers")}`}
          icon="👥"
          trend={{
            value: stats.recent.owners + stats.recent.customers,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalShops")}
          value={stats.totals.shops}
          icon="🏪"
          trend={{
            value: stats.recent.shops,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalBookings")}
          value={stats.totals.bookings}
          icon="📅"
          trend={{
            value: stats.recent.bookings,
            label: t("admin.newLast7Days"),
          }}
        />
        <AdminStatsCard
          title={t("admin.totalRevenue")}
          value={formatCurrency(stats.totals.revenue)}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">{t("admin.newOwners")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.owners}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newCustomers")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.customers}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newShops")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.shops}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{t("admin.newBookings")}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recent.bookings}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

