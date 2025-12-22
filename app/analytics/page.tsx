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
  total_revenue: number;
  average_booking_value: number;
  unique_customers: number;
  new_customers_30_days: number;
  total_reviews: number;
  average_rating: number;
  bookings_last_7_days: number;
  bookings_last_30_days: number;
  revenue_last_7_days: number;
  revenue_last_30_days: number;
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
        setRevenueData(revenue);
      }

      if (performanceRes.ok) {
        const performance = await performanceRes.json();
        setPerformanceData(performance);
      }

      if (customersRes.ok) {
        const customers = await customersRes.json();
        setCustomerData(customers);
      }

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        setBookingData(bookings);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
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

  // Prepare chart data
  const revenueChartData = revenueData?.daily.map((d) => ({
    x: new Date(d.booking_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    y: parseFloat(d.revenue.toString()),
  })) || [];

  const bookingsChartData = bookingData?.grouped.map((g) => ({
    label: new Date(g.period).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: g.total,
  })) || [];

  const bookingStatusChartData = bookingData?.totals ? [
    { label: "Completed", value: bookingData.totals.completed, color: "#10B981" },
    { label: "Confirmed", value: bookingData.totals.confirmed, color: "#3B82F6" },
    { label: "Pending", value: bookingData.totals.pending, color: "#F59E0B" },
    { label: "Cancelled", value: bookingData.totals.cancelled, color: "#EF4444" },
  ] : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title') || 'Analytics Dashboard'}</h1>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "7" | "30" | "90" | "365")}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "overview", label: "Overview" },
          { key: "revenue", label: "Revenue" },
          { key: "customers", label: "Customers" },
          { key: "bookings", label: "Bookings" },
          { key: "performance", label: "Performance" },
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
              title="Total Revenue"
              value={`¥${performanceData?.total_revenue?.toLocaleString() || 0}`}
              subtitle={`Last ${period} days`}
            />
            <AnalyticsCard
              title="Total Bookings"
              value={performanceData?.total_bookings || 0}
              subtitle={`${performanceData?.completed_bookings || 0} completed`}
            />
            <AnalyticsCard
              title="Unique Customers"
              value={performanceData?.unique_customers || 0}
              subtitle={`${performanceData?.new_customers_30_days || 0} new (30d)`}
            />
            <AnalyticsCard
              title="Average Rating"
              value={performanceData?.average_rating?.toFixed(1) || "0.0"}
              subtitle={`${performanceData?.total_reviews || 0} reviews`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              {revenueChartData.length > 0 ? (
                <LineChart data={revenueChartData} height={300} color="#10B981" />
              ) : (
                <p className="text-gray-500">No revenue data available</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
              {bookingStatusChartData.length > 0 ? (
                <BarChart data={bookingStatusChartData} height={300} />
              ) : (
                <p className="text-gray-500">No booking data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnalyticsCard
              title="Total Revenue"
              value={`¥${revenueData.summary?.total_revenue?.toLocaleString() || 0}`}
            />
            <AnalyticsCard
              title="Last 30 Days"
              value={`¥${revenueData.summary?.revenue_last_30_days?.toLocaleString() || 0}`}
            />
            <AnalyticsCard
              title="Last 7 Days"
              value={`¥${revenueData.summary?.revenue_last_7_days?.toLocaleString() || 0}`}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Revenue</h3>
            {revenueChartData.length > 0 ? (
              <LineChart data={revenueChartData} height={400} color="#10B981" />
            ) : (
              <p className="text-gray-500">No revenue data available</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.daily.slice(-10).reverse().map((day, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.booking_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.bookings_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ¥{parseFloat(day.revenue.toString()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
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
              title="Total Customers"
              value={customerData.summary?.total_customers || 0}
            />
            <AnalyticsCard
              title="New (30 days)"
              value={customerData.summary?.new_customers_30_days || 0}
            />
            <AnalyticsCard
              title="Avg Bookings/Customer"
              value={customerData.summary?.average_bookings_per_customer?.toFixed(1) || "0.0"}
            />
            <AnalyticsCard
              title="Avg Spent/Customer"
              value={`¥${customerData.summary?.average_spent_per_customer?.toLocaleString() || 0}`}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Booking</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerData.customers
                    .sort((a, b) => b.total_spent - a.total_spent)
                    .slice(0, 10)
                    .map((customer, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Customer {customer.customer_id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.total_bookings}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.completed_bookings}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ¥{customer.total_spent.toLocaleString()}
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
              title="Total"
              value={bookingData.totals.total}
            />
            <AnalyticsCard
              title="Completed"
              value={bookingData.totals.completed}
              subtitle="green"
            />
            <AnalyticsCard
              title="Confirmed"
              value={bookingData.totals.confirmed}
              subtitle="blue"
            />
            <AnalyticsCard
              title="Pending"
              value={bookingData.totals.pending}
              subtitle="yellow"
            />
            <AnalyticsCard
              title="Cancelled"
              value={bookingData.totals.cancelled}
              subtitle="red"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Bookings Over Time</h3>
            {bookingsChartData.length > 0 ? (
              <BarChart data={bookingsChartData} height={400} />
            ) : (
              <p className="text-gray-500">No booking data available</p>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && performanceData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Completion Rate"
              value={`${performanceData.completion_rate?.toFixed(1) || 0}%`}
            />
            <AnalyticsCard
              title="Cancellation Rate"
              value={`${performanceData.cancellation_rate?.toFixed(1) || 0}%`}
            />
            <AnalyticsCard
              title="Avg Booking Value"
              value={`¥${performanceData.average_booking_value?.toLocaleString() || 0}`}
            />
            <AnalyticsCard
              title="Bookings (Last 7d)"
              value={performanceData.bookings_last_7_days || 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="font-semibold">{performanceData.total_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-semibold text-green-600">{performanceData.completed_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelled:</span>
                  <span className="font-semibold text-red-600">{performanceData.cancelled_bookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-semibold">{performanceData.completion_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancellation Rate:</span>
                  <span className="font-semibold">{performanceData.cancellation_rate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold text-green-600">¥{performanceData.total_revenue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last 30 Days:</span>
                  <span className="font-semibold">¥{performanceData.revenue_last_30_days?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last 7 Days:</span>
                  <span className="font-semibold">¥{performanceData.revenue_last_7_days?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Booking Value:</span>
                  <span className="font-semibold">¥{performanceData.average_booking_value?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
