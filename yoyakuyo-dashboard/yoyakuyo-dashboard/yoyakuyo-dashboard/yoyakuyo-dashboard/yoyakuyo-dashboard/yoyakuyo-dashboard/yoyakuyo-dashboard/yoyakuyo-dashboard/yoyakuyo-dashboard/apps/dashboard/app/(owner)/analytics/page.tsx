// apps/dashboard/app/(owner)/analytics/page.tsx
// Analytics dashboard for shop owners

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import AnalyticsCard from '../../components/AnalyticsCard';
import LineChart from '../../components/LineChart';
import BarChart from '../../components/BarChart';

interface Shop {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Overview stats
  const [overview, setOverview] = useState<any>(null);
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [servicePopularity, setServicePopularity] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [peakHours, setPeakHours] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadShop();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (shop) {
      loadAnalytics();
    }
  }, [shop, dateRange, customStartDate, customEndDate]);

  const loadShop = async () => {
    try {
      const res = await fetch(`${apiUrl}/shops?owner_user_id=${user?.id}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      if (res.ok) {
        const shops = await res.json();
        if (shops && shops.length > 0) {
          setShop(shops[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const endDate = new Date().toISOString();
    let startDate: Date;

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    if (dateRange === '7') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '90') {
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    } else {
      // 30 days default
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate: startDate.toISOString(), endDate };
  };

  const loadAnalytics = async () => {
    if (!shop) return;

    const { startDate, endDate } = getDateRange();

    try {
      setLoading(true);

      // Load all analytics in parallel
      const [
        overviewRes,
        trendsRes,
        servicesRes,
        staffRes,
        customersRes,
        peakHoursRes,
      ] = await Promise.all([
        fetch(
          `${apiUrl}/analytics/shop/${shop.id}/overview?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: { 'x-user-id': user?.id || '' },
          }
        ),
        fetch(
          `${apiUrl}/analytics/shop/${shop.id}/bookings?start_date=${startDate}&end_date=${endDate}&group_by=day`,
          {
            headers: { 'x-user-id': user?.id || '' },
          }
        ),
        fetch(
          `${apiUrl}/analytics/shop/${shop.id}/services?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: { 'x-user-id': user?.id || '' },
          }
        ),
        fetch(
          `${apiUrl}/analytics/shop/${shop.id}/staff?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: { 'x-user-id': user?.id || '' },
          }
        ),
        fetch(
          `${apiUrl}/analytics/shop/${shop.id}/customers?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: { 'x-user-id': user?.id || '' },
          }
        ),
        fetch(
          `${apiUrl}/analytics/shop/${shop.id}/peak-hours?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: { 'x-user-id': user?.id || '' },
          }
        ),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setBookingTrends(data);
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServicePopularity(data);
      }
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffPerformance(data);
      }
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomerAnalytics(data);
      }
      if (peakHoursRes.ok) {
        const data = await peakHoursRes.json();
        setPeakHours(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">{t('myShop.noShop')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('analytics.title')}
        </h1>
        <p className="text-gray-600">{shop.name}</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">
            {t('analytics.dateRange')}:
          </label>
          <button
            onClick={() => setDateRange('7')}
            className={`px-4 py-2 rounded-md ${
              dateRange === '7'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('analytics.last7Days')}
          </button>
          <button
            onClick={() => setDateRange('30')}
            className={`px-4 py-2 rounded-md ${
              dateRange === '30'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('analytics.last30Days')}
          </button>
          <button
            onClick={() => setDateRange('90')}
            className={`px-4 py-2 rounded-md ${
              dateRange === '90'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('analytics.last90Days')}
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-md ${
              dateRange === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('analytics.custom')}
          </button>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <AnalyticsCard
            title={t('analytics.bookings')}
            value={overview.totalBookings}
            subtitle={t('analytics.averagePerDay') + ': ' + overview.averageBookingsPerDay.toFixed(1)}
          />
          <AnalyticsCard
            title={t('analytics.revenue')}
            value={`¥${overview.totalRevenue.toLocaleString()}`}
            subtitle={t('analytics.averagePerDay') + ': ¥' + overview.averageRevenuePerDay.toFixed(0)}
          />
          <AnalyticsCard
            title={t('analytics.cancellationRate')}
            value={`${overview.cancellationRate.toFixed(1)}%`}
          />
          <AnalyticsCard
            title={t('analytics.completedBookings')}
            value={overview.completedBookings}
          />
        </div>
      )}

      {/* Booking Trends Chart */}
      {bookingTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('analytics.bookingTrends')}
          </h2>
          <LineChart
            data={bookingTrends.map((t) => ({
              x: t.date,
              y: t.count,
            }))}
            height={300}
            xLabel={t('analytics.date')}
            yLabel={t('analytics.bookings')}
          />
        </div>
      )}

      {/* Service Popularity */}
      {servicePopularity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('analytics.servicePopularity')}
          </h2>
          <BarChart
            data={servicePopularity.slice(0, 10).map((s) => ({
              label: s.serviceName,
              value: s.bookingCount,
            }))}
            height={300}
          />
        </div>
      )}

      {/* Staff Performance */}
      {staffPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('analytics.staffPerformance')}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('myShop.staff')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('analytics.bookings')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffPerformance.map((staff) => (
                  <tr key={staff.staffId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {staff.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.bookingCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Analytics */}
      {customerAnalytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('analytics.customerAnalytics')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              title={t('analytics.newCustomers')}
              value={customerAnalytics.newCustomers}
            />
            <AnalyticsCard
              title={t('analytics.returningCustomers')}
              value={customerAnalytics.returningCustomers}
            />
          </div>
        </div>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('analytics.peakHours')}
          </h2>
          <BarChart
            data={peakHours.map((h) => ({
              label: `${h.hour}:00`,
              value: h.bookingCount,
            }))}
            height={300}
          />
        </div>
      )}
    </div>
  );
}

