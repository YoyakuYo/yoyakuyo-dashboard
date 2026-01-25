// Admin Analytics - Performance Only
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import AdminStatsCard from '@/app/components/admin/AdminStatsCard';

interface PlatformOverview {
  totalShops: number;
  verifiedShops: number;
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
  customerRoles: { guest: number; line: number; other: number };
  peakBookingHours: Array<{ hour: number; bookings: number }>;
  peakBookingDays: Array<{ day: string; bookings: number }>;
}

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin.analytics');
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview>({
    totalShops: 0,
    verifiedShops: 0,
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
    customerRoles: { guest: 0, line: 0, other: 0 },
    peakBookingHours: [],
    peakBookingDays: []
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Platform Overview - count all shops, but fetch verified shops for performance
      const [allShopsCountResult, verifiedShopsResult, customersResult, customerProfilesResult, bookingsResult, lineAccountsResult] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }), // Count all shops
        supabase.from('shops').select('id, name, created_at, updated_at').eq('is_verified', true), // Verified shops for performance
        supabase.from('customers').select('id, name, email, role, auth_user_id'), // Get customers
        supabase.from('customer_profiles').select('id, name, email'), // Get customer profiles
        supabase.from('bookings').select('id, created_at, status, shop_id, customer_id'),
        supabase.from('line_accounts').select('customer_id, line_user_id')
      ]);

      if (allShopsCountResult.error) throw allShopsCountResult.error;
      if (verifiedShopsResult.error) throw verifiedShopsResult.error;
      if (customersResult.error) throw customersResult.error;
      if (customerProfilesResult.error) throw customerProfilesResult.error;
      if (bookingsResult.error) throw bookingsResult.error;
      if (lineAccountsResult.error) {
        console.warn("[Admin Analytics] Failed to load LINE accounts:", lineAccountsResult.error);
      }

      const totalShops = allShopsCountResult.count || 0;
      const verifiedShops = verifiedShopsResult.data || [];
      const customersData = customersResult.data || [];
      const customerProfilesData = customerProfilesResult.data || [];
      const allBookings = bookingsResult.data || [];
      const lineAccountsData = lineAccountsResult.data || [];
      const lineAccountsMap = new Map(lineAccountsData.map((account) => [account.customer_id, account.line_user_id]));

      // Create a map of customer profiles by ID for easy lookup
      const customerProfilesMap = new Map(customerProfilesData.map(profile => [profile.id, profile]));

      // For now, just use customers data directly since customer_profiles doesn't match
      // The web customer names/emails need to be populated in the customers table itself
      const enrichedCustomers = customersData.map(customer => ({
        ...customer,
        customer_profiles: null, // Disable profiles lookup since IDs don't match
        line_user_id: lineAccountsMap.get(customer.id) || null,
        is_line: lineAccountsMap.has(customer.id) || customer.role?.toLowerCase() === 'line',
      }));

      // Only include bookings from verified shops for performance metrics
      const verifiedShopIds = new Set(verifiedShops.map(shop => shop.id));
      const bookings = allBookings.filter(booking => verifiedShopIds.has(booking.shop_id));

      // Get unique customer IDs from bookings
      const activeCustomerIds = new Set(bookings.map(booking => booking.customer_id).filter(Boolean));

      // Filter customers to only those who have made bookings
      const activeCustomers = enrichedCustomers.filter(customer => activeCustomerIds.has(customer.id));

      // Set active customers state for UI display (only customers who have made bookings)
      setCustomers(activeCustomers);

      // Calculate customer role breakdown from active customers only
      const customerRoles = activeCustomers.reduce((acc, customer) => {
        if (customer.is_line) {
          acc.line++;
        } else if (customer.role?.toLowerCase() === 'guest') {
          acc.guest++;
        } else {
          acc.other++;
        }
        return acc;
      }, { guest: 0, line: 0, other: 0 });

      // Calculate active verified shops (updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeVerifiedShops = verifiedShops.filter(shop =>
        new Date(shop.updated_at) > thirtyDaysAgo
      ).length;

      // Calculate platform overview
      const totalBookings = bookings.length;
      const verifiedShopsCount = verifiedShops.length;

      setPlatformOverview({
        totalShops,
        verifiedShops: verifiedShopsCount,
        activeShops: activeVerifiedShops,
        totalCustomers: activeCustomers.length,
        totalBookings,
        visitorsToday: 0 // This would need analytics tracking implementation
      });

      // Shop Performance
      const shopBookings = bookings.reduce((acc, booking) => {
        acc[booking.shop_id] = (acc[booking.shop_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Include all verified shops, even those with 0 bookings
      const shopBookingsArray = verifiedShops.map(shop => {
        const bookingCount = shopBookings[shop.id] || 0;
        return { name: shop.name || 'Unknown Shop', bookings: bookingCount };
      });

      const sortedShops = shopBookingsArray.sort((a, b) => b.bookings - a.bookings);
      const mostActiveShops = sortedShops.slice(0, 5);

      // Least active: shops with less than 5 bookings
      const leastActiveShops = shopBookingsArray
        .filter(shop => shop.bookings < 5)
        .sort((a, b) => a.bookings - b.bookings)
        .slice(0, 5);

      // Cancellation rate
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      // Inactive verified shops (no bookings in last 30 days)
      const recentBookings = bookings.filter(b =>
        new Date(b.created_at) > thirtyDaysAgo
      );
      const activeVerifiedShopIds = new Set(recentBookings.map(b => b.shop_id));
      const inactiveVerifiedShops = verifiedShops.filter(shop => !activeVerifiedShopIds.has(shop.id)).length;

      setShopPerformance({
        bookingsPerShop: verifiedShopsCount > 0 ? Math.round(totalBookings / verifiedShopsCount) : 0,
        mostActiveShops,
        leastActiveShops,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        inactiveShops: inactiveVerifiedShops
      });

      // Customer Activity
      const customerBookings = bookings.reduce((acc, booking) => {
        acc[booking.customer_id || 'unknown'] = (acc[booking.customer_id || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const customerBookingsArray = Object.values(customerBookings);
      const repeatCustomers = customerBookingsArray.filter(count => count > 1).length;
      const avgBookingsPerCustomer = activeCustomers.length > 0 ?
        Math.round((totalBookings / activeCustomers.length) * 100) / 100 : 0;

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
        activeCustomers: activeCustomers.length,
        repeatCustomers,
        avgBookingsPerCustomer,
        customerRoles,
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
          <div className="text-lg text-gray-600">{t('loadingAnalytics')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('errorLoadingAnalytics')}: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('platformPerformance')}</p>
      </div>

      {/* Platform Overview */}
        <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('platformOverview')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <AdminStatsCard
            title={t('totalShops')}
            value={platformOverview.totalShops.toString()}
            icon="🏪"
          />
          <AdminStatsCard
            title={t('verifiedShops')}
            value={platformOverview.verifiedShops.toString()}
            subtitle={t('activeAndVerified')}
            icon="✅"
          />
          <AdminStatsCard
            title={t('activeShops')}
            value={platformOverview.activeShops.toString()}
            subtitle={t('updatedLast30Days')}
            icon="🔄"
          />
          <AdminStatsCard
            title={t('totalCustomers')}
            value={platformOverview.totalCustomers.toString()}
            icon="👥"
          />
          <AdminStatsCard
            title={t('totalBookings')}
            value={platformOverview.totalBookings.toString()}
            icon="📅"
          />
          <AdminStatsCard
            title={t('visitorsToday')}
            value={platformOverview.visitorsToday.toString()}
            subtitle={t('realTimeTracking')}
            icon="👁️"
          />
        </div>
      </div>

      {/* Shop Performance */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('shopPerformance')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <AdminStatsCard
            title={t('avgBookingsPerShop')}
            value={shopPerformance.bookingsPerShop.toString()}
            icon="📊"
          />
          <AdminStatsCard
            title={t('cancellationRate')}
            value={`${shopPerformance.cancellationRate}%`}
            icon="❌"
          />
          <AdminStatsCard
            title={t('mostActiveShops')}
            value={shopPerformance.mostActiveShops.length.toString()}
            subtitle={t('top5ByBookings')}
            icon="🔥"
          />
          <AdminStatsCard
            title={t('inactiveShops')}
            value={shopPerformance.inactiveShops.toString()}
            subtitle={t('noBookings30Days')}
            icon="😴"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Active Shops */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('mostActiveShopsTitle')}</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('leastActiveShopsTitle')}</h3>
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('customerActivity')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
          <AdminStatsCard
            title={t('activeCustomers')}
            value={customerActivity.activeCustomers.toString()}
            subtitle={t('madeAtLeast1Booking')}
            icon="👤"
          />
          <AdminStatsCard
            title={t('repeatCustomers')}
            value={customerActivity.repeatCustomers.toString()}
            subtitle={t('multipleBookings')}
            icon="🔄"
          />
          <AdminStatsCard
            title={t('avgBookingsPerCustomer')}
            value={customerActivity.avgBookingsPerCustomer.toString()}
            icon="📈"
          />
          <AdminStatsCard
            title={t('guestCustomers')}
            value={customerActivity.customerRoles.guest.toString()}
            subtitle={t('anonymousBookings')}
            icon="👤"
          />
          <AdminStatsCard
            title={t('lineCustomers')}
            value={customerActivity.customerRoles.line.toString()}
            subtitle={t('lineAppUsers')}
            icon="📱"
          />
      </div>

        {/* Customer Role Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Guest Customers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('guestCustomersTitle')}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers
                .filter(customer => customer.role?.toLowerCase() === 'guest')
                .map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.customer_profiles?.name || customer.name || `Guest Customer ${index + 1}`}
                        </div>
                        <div className="text-sm text-gray-500">{customer.customer_profiles?.email || customer.email || 'Anonymous booking'}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* LINE Customers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('lineCustomersTitle')}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers
                .filter(customer => customer.is_line)
                .map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.customer_profiles?.name || customer.name || customer.line_user_id || `LINE Customer ${index + 1}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.customer_profiles?.email || customer.email || customer.line_user_id || 'LINE app user'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Booking Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('peakBookingHours')}</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('peakBookingDays')}</h3>
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