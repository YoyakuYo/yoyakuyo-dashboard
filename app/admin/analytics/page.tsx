// Admin Analytics - Performance Only
"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import AdminStatsCard from '@/app/components/admin/AdminStatsCard';

interface PlatformOverview {
  totalShops: number;
  activeShops: number;
  totalCustomers: number;
  totalBookings: number;
  visitorsToday: number;
}

interface ShopPerformance {
  bookingsPerShop: number;
  mostActiveShops: Array<{ name: string; bookings: number }>;
  leastActiveShops: Array<{ name: string; bookings: number }>;
  cancellationRate: number;
  inactiveShops: number;
}

interface CustomerActivity {
  activeCustomers: number;
  repeatCustomers: number;
  avgBookingsPerCustomer: number;
  peakBookingHours: Array<{ hour: number; bookings: number }>;
  peakBookingDays: Array<{ day: string; bookings: number }>;
}

export default function AdminAnalyticsPage() {
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview>({
    totalShops: 0,
    activeShops: 0,
    totalCustomers: 0,
    totalBookings: 0,
    visitorsToday: 0
  });

  const [shopPerformance, setShopPerformance] = useState<ShopPerformance>({
    bookingsPerShop: 0,
    mostActiveShops: [],
    leastActiveShops: [],
    cancellationRate: 0,
    inactiveShops: 0
  });

  const [customerActivity, setCustomerActivity] = useState<CustomerActivity>({
    activeCustomers: 0,
    repeatCustomers: 0,
    avgBookingsPerCustomer: 0,
    peakBookingHours: [],
    peakBookingDays: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Platform Overview
      const [shopsResult, customersResult, bookingsResult] = await Promise.all([
        supabase.from('shops').select('id, name, created_at, updated_at'),
        supabase.from('profiles').select('id, created_at').eq('role', 'customer'),
        supabase.from('bookings').select('id, created_at, status, shop_id, customer_id')
      ]);

      if (shopsResult.error) throw shopsResult.error;
      if (customersResult.error) throw customersResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      const shops = shopsResult.data || [];
      const customers = customersResult.data || [];
      const bookings = bookingsResult.data || [];

      // Calculate active shops (updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeShops = shops.filter(shop =>
        new Date(shop.updated_at) > thirtyDaysAgo
      ).length;

      // Calculate platform overview
      const totalBookings = bookings.length;
      const totalCustomers = customers.length;
      const totalShops = shops.length;

      setPlatformOverview({
        totalShops,
        activeShops,
        totalCustomers,
        totalBookings,
        visitorsToday: 0 // This would need analytics tracking implementation
      });

      // Shop Performance
      const shopBookings = bookings.reduce((acc, booking) => {
        acc[booking.shop_id] = (acc[booking.shop_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const shopBookingsArray = Object.entries(shopBookings).map(([shopId, count]) => {
        const shop = shops.find(s => s.id === shopId);
        return { name: shop?.name || 'Unknown Shop', bookings: count };
      });

      const sortedShops = shopBookingsArray.sort((a, b) => b.bookings - a.bookings);
      const mostActiveShops = sortedShops.slice(0, 5);
      const leastActiveShops = sortedShops.slice(-5).reverse();

      // Cancellation rate
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      // Inactive shops (no bookings in last 30 days)
      const recentBookings = bookings.filter(b =>
        new Date(b.created_at) > thirtyDaysAgo
      );
      const activeShopIds = new Set(recentBookings.map(b => b.shop_id));
      const inactiveShops = shops.filter(shop => !activeShopIds.has(shop.id)).length;

      setShopPerformance({
        bookingsPerShop: totalShops > 0 ? Math.round(totalBookings / totalShops) : 0,
        mostActiveShops,
        leastActiveShops,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        inactiveShops
      });

      // Customer Activity
      const customerBookings = bookings.reduce((acc, booking) => {
        acc[booking.customer_id || 'unknown'] = (acc[booking.customer_id || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const customerBookingsArray = Object.values(customerBookings);
      const activeCustomers = Object.keys(customerBookings).length;
      const repeatCustomers = customerBookingsArray.filter(count => count > 1).length;
      const avgBookingsPerCustomer = activeCustomers > 0 ?
        Math.round((totalBookings / activeCustomers) * 100) / 100 : 0;

      // Peak booking hours
      const hourBookings = bookings.reduce((acc, booking) => {
        const hour = new Date(booking.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const peakBookingHours = Object.entries(hourBookings)
        .map(([hour, count]) => ({ hour: parseInt(hour), bookings: count }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Peak booking days
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayBookings = bookings.reduce((acc, booking) => {
        const day = dayNames[new Date(booking.created_at).getDay()];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const peakBookingDays = Object.entries(dayBookings)
        .map(([day, count]) => ({ day, bookings: count }))
        .sort((a, b) => b.bookings - a.bookings);

      setCustomerActivity({
        activeCustomers,
        repeatCustomers,
        avgBookingsPerCustomer,
        peakBookingHours,
        peakBookingDays
      });

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform performance and activity metrics</p>
      </div>

      {/* Platform Overview */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <AdminStatsCard
            title="Total Shops"
            value={platformOverview.totalShops.toString()}
            icon="🏪"
          />
          <AdminStatsCard
            title="Active Shops"
            value={platformOverview.activeShops.toString()}
            subtitle="Updated in last 30 days"
            icon="✅"
          />
          <AdminStatsCard
            title="Total Customers"
            value={platformOverview.totalCustomers.toString()}
            icon="👥"
          />
          <AdminStatsCard
            title="Total Bookings"
            value={platformOverview.totalBookings.toString()}
            icon="📅"
          />
          <AdminStatsCard
            title="Visitors Today"
            value={platformOverview.visitorsToday.toString()}
            subtitle="Real-time tracking"
            icon="👁️"
          />
        </div>
      </div>

      {/* Shop Performance */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Shop Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <AdminStatsCard
            title="Avg Bookings per Shop"
            value={shopPerformance.bookingsPerShop.toString()}
            icon="📊"
          />
          <AdminStatsCard
            title="Cancellation Rate"
            value={`${shopPerformance.cancellationRate}%`}
            icon="❌"
          />
          <AdminStatsCard
            title="Most Active Shops"
            value={shopPerformance.mostActiveShops.length.toString()}
            subtitle="Top 5 by bookings"
            icon="🔥"
          />
          <AdminStatsCard
            title="Inactive Shops"
            value={shopPerformance.inactiveShops.toString()}
            subtitle="No bookings in 30 days"
            icon="😴"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Active Shops */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Shops</h3>
            <div className="space-y-3">
              {shopPerformance.mostActiveShops.map((shop, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{index + 1}</span>
                    <span className="font-medium">{shop.name}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {shop.bookings} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Least Active Shops */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Least Active Shops</h3>
            <div className="space-y-3">
              {shopPerformance.leastActiveShops.map((shop, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{index + 1}</span>
                    <span className="font-medium">{shop.name}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                    {shop.bookings} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Activity */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Customer Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <AdminStatsCard
            title="Active Customers"
            value={customerActivity.activeCustomers.toString()}
            subtitle="Made at least 1 booking"
            icon="👤"
          />
          <AdminStatsCard
            title="Repeat Customers"
            value={customerActivity.repeatCustomers.toString()}
            subtitle="Multiple bookings"
            icon="🔄"
          />
          <AdminStatsCard
            title="Avg Bookings/Customer"
            value={customerActivity.avgBookingsPerCustomer.toString()}
            icon="📈"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Booking Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Booking Hours</h3>
            <div className="space-y-3">
              {customerActivity.peakBookingHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">
                    {hour.hour}:00 - {hour.hour + 1}:00
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {hour.bookings} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Booking Days */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Booking Days</h3>
            <div className="space-y-3">
              {customerActivity.peakBookingDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{day.day}</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {day.bookings} bookings
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}