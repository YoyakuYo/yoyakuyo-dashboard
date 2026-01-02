"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";
import BarChart from "@/app/components/BarChart";
import LineChart from "@/app/components/LineChart";
import AnalyticsCard from "@/app/components/AnalyticsCard";

interface RevenueData {
  summary: any;
  daily: Array<{
    booking_date: string;
    revenue: number;
    bookings_count: number;
  }>;
  period_days: number;
}

interface PerformanceData {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  completion_rate: number;
  cancellation_rate: number;
  // Revenue / booked value metrics
  total_revenue?: number;
  revenue_last_7_days?: number;
  revenue_last_30_days?: number;
  total_booked_value?: number;
  booked_value_last_7_days?: number;
  booked_value_last_30_days?: number;
  average_booking_value: number;
  unique_customers: number;
  new_customers_30_days: number;
  total_reviews: number;
  average_rating: number;
  bookings_last_7_days: number;
  bookings_last_30_days: number;
}

interface CustomerData {
  customers: Array<{
    customer_id: string;
    total_bookings: number;
    completed_bookings: number;
    total_spent: number;
    first_booking: string;
    last_booking: string;
  }>;
  summary: {
    total_customers: number;
    new_customers_30_days: number;
    average_bookings_per_customer: number;
    average_spent_per_customer: number;
    total_revenue: number;
  };
}

interface BookingAnalytics {
  grouped: Array<{
    period: string;
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }>;
  totals: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  period_days: number;
  group_by: string;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "customers" | "bookings" | "performance">("overview");
  const [period, setPeriod] = useState<"7" | "30" | "90" | "365">("30");
  
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [bookingData, setBookingData] = useState<BookingAnalytics | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      loadAllAnalytics();
    }
  }, [user, period]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const headers = { "x-user-id": user?.id || "" };

      const [revenueRes, performanceRes, customersRes, bookingsRes] = await Promise.all([
        fetch(`${apiUrl}/analytics/revenue?period=${period}`, { headers }),
        fetch(`${apiUrl}/analytics/performance`, { headers }),
        fetch(`${apiUrl}/analytics/customers`, { headers }),
        fetch(`${apiUrl}/analytics/bookings?period=${period}&group_by=day`, { headers }),
      ]);

      if (revenueRes.ok) {
        const revenue = await revenueRes.json();
        console.log("[Analytics] Revenue data loaded:", revenue);
        setRevenueData(revenue);
      } else {
        const error = await revenueRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Analytics] Revenue error:", error);
      }

      if (performanceRes.ok) {
        const performance = await performanceRes.json();
        console.log("[Analytics] Performance data loaded:", performance);
        setPerformanceData(performance);
      } else {
        const error = await performanceRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Analytics] Performance error:", error);
      }

      if (customersRes.ok) {
        const customers = await customersRes.json();
        console.log("[Analytics] Customers data loaded:", customers);
        setCustomerData(customers);
      } else {
        const error = await customersRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Analytics] Customers error:", error);
      }

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        console.log("[Analytics] Bookings data loaded:", bookings);
        setBookingData(bookings);
      } else {
        const error = await bookingsRes.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Analytics] Bookings error:", error);
      }
    } catch (error) {
      console.error("[Analytics] Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const headers = { "x-user-id": user?.id || "" };
      const res = await fetch(`${apiUrl}/analytics/report?period=${period}`, { headers });
      
      if (res.ok) {
        const report = await res.json();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
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

  const formatCurrency = (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value || 0);
    if (Number.isNaN(num)) return "¥0";
    return `¥${num.toLocaleString()}`;
  };

  // Prepare chart data (handle both function results and direct query results)
  const revenueChartData =
    revenueData?.daily?.map((d: any) => {
      const raw = d.revenue ?? d.booked_value ?? 0;
      const y = typeof raw === "number" ? raw : Number(raw || 0);
      return {
        x: new Date(d.booking_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        y: Number.isNaN(y) ? 0 : y,
      };
    }) || [];

  const bookingsChartData = bookingData?.grouped?.map((g: any) => ({
    label: new Date(g.period).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: g.total || 0,
  })) || [];

  const bookingStatusChartData = bookingData?.totals ? [
    { label: "Completed", value: bookingData.totals.completed || 0, color: "#10B981" },
    { label: "Confirmed", value: bookingData.totals.confirmed || 0, color: "#3B82F6" },
    { label: "Pending", value: bookingData.totals.pending || 0, color: "#F59E0B" },
    { label: "Cancelled", value: bookingData.totals.cancelled || 0, color: "#EF4444" },
  ] : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h1>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "7" | "30" | "90" | "365")}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">{t('analytics.last7Days')}</option>
            <option value="30">{t('analytics.last30Days')}</option>
            <option value="90">{t('analytics.last90Days')}</option>
            <option value="365">{t('analytics.lastYear')}</option>
          </select>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('analytics.exportReport')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "overview", label: t('analytics.overview') },
          { key: "revenue", label: t('analytics.revenue') },
          { key: "customers", label: t('analytics.customerAnalytics') },
          { key: "bookings", label: t('analytics.bookings') },
          { key: "performance", label: t('analytics.performance') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title={t('analytics.totalRevenue')}
              value={formatCurrency(
                performanceData?.total_revenue ??
                  performanceData?.total_booked_value ??
                  0
              )}
              subtitle={t('analytics.allTimeCompletedBookings')}
            />
            <AnalyticsCard
              title={t('analytics.totalBookings')}
              value={performanceData?.total_bookings || 0}
              subtitle={`${performanceData?.completed_bookings || 0} ${t('analytics.completed')}`}
            />
            <AnalyticsCard
              title={t('analytics.uniqueCustomers')}
              value={performanceData?.unique_customers || 0}
              subtitle={`${t('analytics.newCustomers')}: ${performanceData?.new_customers_30_days || 0}`}
            />
            <AnalyticsCard
              title={t('analytics.averageRating')}
              value={performanceData?.average_rating?.toFixed(1) || "0.0"}
              subtitle={`${performanceData?.total_reviews || 0} ${t('analytics.reviews')}`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{t('analytics.revenueTrend')}</h3>
              {revenueChartData.length > 0 ? (
                <LineChart data={revenueChartData} height={300} color="#10B981" />
              ) : (
                <p className="text-gray-500">{t('analytics.noAnalyticsData')}</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{t('analytics.bookingStatus')}</h3>
              {bookingStatusChartData.length > 0 ? (
                <BarChart data={bookingStatusChartData} height={300} />
              ) : (
                <p className="text-gray-500">{t('analytics.noAnalyticsData')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && revenueData && (
        <div className="space-y-6">
          {(() => {
            const rawSummary: any = revenueData.summary;
            const summary = Array.isArray(rawSummary)
              ? rawSummary[0] || {}
              : rawSummary || {};

            const totalRevenueValue =
              summary.total_revenue ??
              summary.total_booked_value ??
              summary.totalBookedValue ??
              0;

            const last30Value =
              summary.revenue_last_30_days ??
              summary.booked_value_last_30_days ??
              0;

            const last7Value =
              summary.revenue_last_7_days ??
              summary.booked_value_last_7_days ??
              0;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticsCard
                  title={t('analytics.totalRevenue')}
                  value={formatCurrency(totalRevenueValue)}
                />
                <AnalyticsCard
                  title={t('analytics.last30Days')}
                  value={formatCurrency(last30Value)}
                />
                <AnalyticsCard
                  title={t('analytics.last7Days')}
                  value={formatCurrency(last7Value)}
                />
              </div>
            );
          })()}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{t('analytics.dailyRevenue')}</h3>
            {revenueChartData.length > 0 ? (
              <LineChart data={revenueChartData} height={400} color="#10B981" />
            ) : (
              <p className="text-gray-500">{t('analytics.noAnalyticsData')}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{t('analytics.revenueDetails')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.bookings')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.revenue')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.daily
                    .slice(-10)
                    .reverse()
                    .map((day: any, idx: number) => {
                      const raw = day.revenue ?? day.booked_value ?? 0;
                      const amount =
                        typeof raw === "number" ? raw : Number(raw || 0);
                      return (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(day.booking_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {day.bookings_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(amount)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && customerData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <AnalyticsCard
              title={t('analytics.totalCustomers')}
              value={customerData.summary?.total_customers || 0}
            />
            <AnalyticsCard
              title={t('analytics.new30Days')}
              value={customerData.summary?.new_customers_30_days || 0}
            />
            <AnalyticsCard
              title={t('analytics.avgBookingsPerCustomer')}
              value={customerData.summary?.average_bookings_per_customer?.toFixed(1) || "0.0"}
            />
            <AnalyticsCard
              title={t('analytics.avgSpentPerCustomer')}
              value={formatCurrency(
                customerData.summary?.average_spent_per_customer ?? 0
              )}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{t('analytics.topCustomers')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.customer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.bookings')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.completed')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.totalSpent')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('analytics.lastBooking')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerData.customers
                    .sort((a, b) => b.total_spent - a.total_spent)
                    .slice(0, 10)
                    .map((customer, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {t('analytics.customer')} {customer.customer_id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.total_bookings}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.completed_bookings}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(customer.total_spent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.last_booking).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && bookingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <AnalyticsCard
              title={t('analytics.totalBookings')}
              value={bookingData.totals.total}
            />
            <AnalyticsCard
              title={t('analytics.completed')}
              value={bookingData.totals.completed}
            />
            <AnalyticsCard
              title={t('analytics.confirmed')}
              value={bookingData.totals.confirmed}
            />
            <AnalyticsCard
              title={t('analytics.pending')}
              value={bookingData.totals.pending}
            />
            <AnalyticsCard
              title={t('analytics.cancelled')}
              value={bookingData.totals.cancelled}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{t('analytics.bookingTrends')}</h3>
            {bookingsChartData.length > 0 ? (
              <BarChart data={bookingsChartData} height={400} />
            ) : (
              <p className="text-gray-500">{t('analytics.noAnalyticsData')}</p>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && performanceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title={t('analytics.completionRate')}
              value={`${performanceData.completion_rate?.toFixed(1) || 0}%`}
            />
            <AnalyticsCard
              title={t('analytics.cancellationRate')}
              value={`${performanceData.cancellation_rate?.toFixed(1) || 0}%`}
            />
            <AnalyticsCard
              title={t('analytics.averageBookingValue')}
              value={formatCurrency(performanceData.average_booking_value || 0)}
            />
            <AnalyticsCard
              title={t('analytics.bookingsLast7Days')}
              value={performanceData.bookings_last_7_days || 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{t('analytics.performanceMetrics')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.totalBookings')}:</span>
                  <span className="font-semibold">{performanceData.total_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.completed')}:</span>
                  <span className="font-semibold text-green-600">{performanceData.completed_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.cancelled')}:</span>
                  <span className="font-semibold text-red-600">{performanceData.cancelled_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.completionRate')}:</span>
                  <span className="font-semibold">{performanceData.completion_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.cancellationRate')}:</span>
                  <span className="font-semibold">{performanceData.cancellation_rate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">{t('analytics.revenueMetrics')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.totalRevenue')}:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      performanceData.total_revenue ??
                        performanceData.total_booked_value ??
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.last30Days')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      performanceData.revenue_last_30_days ??
                        performanceData.booked_value_last_30_days ??
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.last7Days')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      performanceData.revenue_last_7_days ??
                        performanceData.booked_value_last_7_days ??
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('analytics.averageBookingValue')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(performanceData.average_booking_value || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
