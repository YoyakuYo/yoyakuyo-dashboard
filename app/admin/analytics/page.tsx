// Admin Analytics - Performance Only
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
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
  const [onlineOwners, setOnlineOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Get user ID for API authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Platform Overview - count all shops, but fetch verified shops for performance
      const [allShopsCountResult, verifiedShopsResult, bookingsResult, customersAnalyticsResult, visitorsAnalyticsResult, onlineOwnersResult] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }), // Count all shops
        supabase.from('shops').select('id, name, created_at, updated_at').eq('is_verified', true), // Verified shops for performance
        supabase.from('bookings').select('id, created_at, status, shop_id, customer_id, source'),
        // Use API endpoint for customer analytics (bypasses RLS)
        (async () => {
          const apiEndpoint = `${apiUrl}/admin/analytics/customers`;
          console.log('[Admin Analytics] Fetching from:', apiEndpoint, 'with user ID:', session.user.id);

          try {
            const response = await fetch(apiEndpoint, {
              headers: {
                'x-user-id': session.user.id,
                'Content-Type': 'application/json',
              },
            });

            console.log('[Admin Analytics] API Response status:', response.status);

            if (!response.ok) {
              const errorText = await response.text().catch(() => 'Unknown error');
              console.error('[Admin Analytics] API Error:', response.status, errorText);
              throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[Admin Analytics] API Response data:', data);
            return data;
          } catch (error) {
            console.error('[Admin Analytics] Fetch error:', error);
            throw error;
          }
        })(),
        // Use API endpoint for visitor analytics
        (async () => {
          const visitorEndpoint = `${apiUrl}/analytics/visitors`;
          console.log('[Admin Analytics] Fetching visitors from:', visitorEndpoint);

          try {
            const response = await fetch(visitorEndpoint, {
              headers: {
                'x-user-id': session.user.id,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              console.warn(`[Admin Analytics] Visitor analytics API failed: ${response.status}, using fallback`);
              return { visitorsToday: 0, dailyVisitors: [], totalSessionsToday: 0 };
            }

            const data = await response.json();
            console.log('[Admin Analytics] Visitor data:', data);
            return data;
          } catch (error) {
            console.warn('[Admin Analytics] Visitor analytics fetch failed, using fallback:', error);
            return { visitorsToday: 0, dailyVisitors: [], totalSessionsToday: 0 };
          }
        })(),
        // Fetch online owners
        (async () => {
          const presenceEndpoint = `${apiUrl}/analytics/presence/online`;
          console.log('[Admin Analytics] Fetching online owners from:', presenceEndpoint);

          try {
            const response = await fetch(presenceEndpoint, {
              headers: {
                'x-user-id': session.user.id,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              console.warn(`[Admin Analytics] Online owners API failed: ${response.status}, using fallback`);
              return { online_count: 0, owners: [] };
            }

            const data = await response.json();
            console.log('[Admin Analytics] Online owners data:', data);
            return data;
          } catch (error) {
            console.warn('[Admin Analytics] Online owners fetch failed, using fallback:', error);
            return { online_count: 0, owners: [] };
          }
        })()
      ]);

      if (allShopsCountResult.error) throw allShopsCountResult.error;
      if (verifiedShopsResult.error) throw verifiedShopsResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      // Handle API response
      if (customersAnalyticsResult.error) {
        console.error('[Admin Analytics] API Error:', customersAnalyticsResult.error);
        throw new Error(customersAnalyticsResult.error);
      }

      const totalShops = allShopsCountResult.count || 0;
      const verifiedShops = verifiedShopsResult.data || [];
      const allBookings = bookingsResult.data || [];
      const customersData = customersAnalyticsResult.customers || [];
      const activeCustomerIds = new Set(customersAnalyticsResult.activeCustomerIds || []);
      const customerRoles = customersAnalyticsResult.customerRoles || { guest: 0, line: 0, other: 0 };
      const onlineOwnersData = onlineOwnersResult?.owners || [];

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Admin Analytics] API Response:', {
          apiUrl,
          userId: session.user.id,
          customersCount: customersData.length,
          customerRoles,
          sampleCustomers: customersData.slice(0, 3).map((c: any) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            line_user_id: c.line_user_id
          }))
        });
      }

      // Use the processed customers from the API
      const enrichedCustomers = customersData;

      // Only include bookings from verified shops for performance metrics
      const verifiedShopIds = new Set(verifiedShops.map(shop => shop.id));
      const bookings = allBookings.filter(booking => verifiedShopIds.has(booking.shop_id));

      // activeCustomerIds is already provided by the API, no need to recalculate
      const lineCustomerIdsFromBookings = new Set(
        bookings
          .filter(booking => booking.source === 'line' && booking.customer_id)
          .map(booking => booking.customer_id)
      );

      // Filter customers to only those who have made bookings (for stats calculations)
      const activeCustomers = enrichedCustomers
        .filter((customer: any) => activeCustomerIds.has(customer.id));

      // Set all customers state for UI display (show all customers, not just those with bookings)
      setCustomers(enrichedCustomers);
      setOnlineOwners(onlineOwnersData);

      // Debug logging for LINE customers
      if (process.env.NODE_ENV === 'development') {
        const allLineCustomers = enrichedCustomers.filter((c: any) => c.role?.toLowerCase() === 'line');
        const lineCustomersWithBookings = activeCustomers.filter((c: any) => c.role?.toLowerCase() === 'line');
        console.log('[Admin Analytics] Customer analysis:', {
          totalCustomers: customersData.length,
          enrichedCustomers: enrichedCustomers.length,
          activeCustomers: activeCustomers.length,
          allLineCustomers: allLineCustomers.length,
          lineCustomersWithBookings: lineCustomersWithBookings.length,
          guestCustomers: activeCustomers.filter((c: any) => c.role?.toLowerCase() === 'guest').length,
          customerRoles,
          sampleAllCustomers: enrichedCustomers.slice(0, 5).map((c: any) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            line_user_id: c.line_user_id
          })),
          sampleLineCustomers: allLineCustomers.slice(0, 3).map((c: any) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            line_user_id: c.line_user_id
          }))
        });
      }

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
        visitorsToday: visitorsAnalyticsResult.visitorsToday || 0
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
          <div className="text-lg text-gray-600">{t('analytics.loadingAnalytics')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{t('analytics.errorLoadingAnalytics')}: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h1>
        <p className="text-gray-600 mt-2">{t('analytics.platformPerformance')}</p>
      </div>

      {/* Platform Overview */}
        <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('analytics.platformOverview')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <AdminStatsCard
            title={t('analytics.totalShops')}
            value={platformOverview.totalShops.toString()}
            icon="🏪"
          />
          <AdminStatsCard
            title={t('analytics.verifiedShops')}
            value={platformOverview.verifiedShops.toString()}
            subtitle={t('analytics.activeAndVerified')}
            icon="✅"
          />
          <AdminStatsCard
            title={t('analytics.activeShops')}
            value={platformOverview.activeShops.toString()}
            subtitle={t('analytics.updatedLast30Days')}
            icon="🔄"
          />
          <AdminStatsCard
            title={t('analytics.totalCustomers')}
            value={platformOverview.totalCustomers.toString()}
            icon="👥"
          />
          <AdminStatsCard
            title={t('analytics.totalBookings')}
            value={platformOverview.totalBookings.toString()}
            icon="📅"
          />
          <AdminStatsCard
            title={t('analytics.visitorsToday')}
            value={platformOverview.visitorsToday.toString()}
            subtitle={t('analytics.realTimeTracking')}
            icon="👁️"
          />
        </div>
      </div>

      {/* Shop Performance */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('analytics.shopPerformance')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <AdminStatsCard
            title={t('analytics.avgBookingsPerShop')}
            value={shopPerformance.bookingsPerShop.toString()}
            icon="📊"
          />
          <AdminStatsCard
            title={t('analytics.cancellationRate')}
            value={`${shopPerformance.cancellationRate}%`}
            icon="❌"
          />
          <AdminStatsCard
            title={t('analytics.mostActiveShops')}
            value={shopPerformance.mostActiveShops.length.toString()}
            subtitle={t('analytics.top5ByBookings')}
            icon="🔥"
          />
          <AdminStatsCard
            title={t('analytics.inactiveShops')}
            value={shopPerformance.inactiveShops.toString()}
            subtitle={t('analytics.noBookings30Days')}
            icon="😴"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Active Shops */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.mostActiveShopsTitle')}</h3>
            <div className="space-y-3">
              {shopPerformance.mostActiveShops.map((shop, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{index + 1}</span>
                    <span className="font-medium">{shop.name}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {t('analytics.bookingCount', { count: shop.bookings })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Least Active Shops */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.leastActiveShopsTitle')}</h3>
            <div className="space-y-3">
              {shopPerformance.leastActiveShops.map((shop, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{index + 1}</span>
                    <span className="font-medium">{shop.name}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                    {t('analytics.bookingCount', { count: shop.bookings })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Online Owners */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('analytics.onlineOwners')}</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">
                {t('analytics.onlineOwnersDescription')}
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              {onlineOwners.length} {t('analytics.online')}
            </div>
          </div>
          {onlineOwners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t('analytics.noOwnersOnline')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {onlineOwners.map((owner: any) => {
                const lastSeen = new Date(owner.last_seen_at);
                const minutesAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000 / 60);
                const shopInitial = owner.shop_name?.charAt(0).toUpperCase() || '?';
                return (
                  <div
                    key={owner.owner_user_id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full absolute -top-1 -right-1 border-2 border-white"></div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {shopInitial}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-lg">
                          {owner.shop_name || 'Unknown Shop'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('analytics.lastSeen')}: {minutesAgo === 0 ? t('analytics.justNow') : t('analytics.minutesAgo', { count: minutesAgo })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer Activity */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('analytics.customerActivity')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
          <AdminStatsCard
            title={t('analytics.activeCustomers')}
            value={customerActivity.activeCustomers.toString()}
            subtitle={t('analytics.madeAtLeast1Booking')}
            icon="👤"
          />
          <AdminStatsCard
            title={t('analytics.repeatCustomers')}
            value={customerActivity.repeatCustomers.toString()}
            subtitle={t('analytics.multipleBookings')}
            icon="🔄"
          />
          <AdminStatsCard
            title={t('analytics.avgBookingsPerCustomer')}
            value={customerActivity.avgBookingsPerCustomer.toString()}
            icon="📈"
          />
          <AdminStatsCard
            title={t('analytics.guestCustomers')}
            value={customerActivity.customerRoles.guest.toString()}
            subtitle={t('analytics.anonymousBookings')}
            icon="👤"
          />
          <AdminStatsCard
            title={t('analytics.lineCustomers')}
            value={customerActivity.customerRoles.line.toString()}
            subtitle={t('analytics.lineAppUsers')}
            icon="📱"
          />
      </div>

        {/* Customer Role Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Guest Customers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.guestCustomersTitle')}</h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.lineCustomersTitle')}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers
                .filter(customer => customer.role?.toLowerCase() === 'line')
                .map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.line_display_name || customer.customer_profiles?.name || customer.name || customer.line_user_id || `LINE Customer ${index + 1}`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.peakBookingHours')}</h3>
            <div className="space-y-3">
              {customerActivity.peakBookingHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">
                    {hour.hour}:00 - {hour.hour + 1}:00
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {t('analytics.bookingCount', { count: hour.bookings })}
                  </span>
            </div>
              ))}
            </div>
      </div>

          {/* Peak Booking Days */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.peakBookingDays')}</h3>
            <div className="space-y-3">
              {customerActivity.peakBookingDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{day.day}</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {t('analytics.bookingCount', { count: day.bookings })}
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