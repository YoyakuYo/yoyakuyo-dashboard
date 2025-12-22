"use client";

import { useEffect, useState, Suspense } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCustomerNotifications } from "../components/CustomerNotificationContext";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";

function CustomerBookingsPageContent() {
  const { user } = useCustomAuth();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerResolved, setCustomerResolved] = useState(false);
  const { setUnreadBookingsCount } = useCustomerNotifications();

  useEffect(() => {
    if (user) {
      loadBookings();
      // Reset notification dot when customer opens bookings page
      setUnreadBookingsCount(0);
    }
  }, [user, filter, setUnreadBookingsCount]);

  // Subscribe to real-time booking updates
  // MUST wait for customer.id to be resolved before subscribing
  // Only start after loadBookings() succeeds (customer will be created by API)
  useEffect(() => {
    if (!user?.id || !customerResolved) return;

    const supabase = getSupabaseClient();
    let channel: any = null;

    // For WEB customers: customers.id = auth.users.id (canonical system)
    // Customer should exist now because loadBookings() API call created it
    // Use user.id directly as customer_id (canonical system)
    const customerId = user.id;
    console.log('[Customer Bookings] Subscribing to bookings for customer_id:', customerId);

    // Subscribe to realtime updates using customer_id directly
    // No need to query customers table - we know customer_id = user.id for WEB customers
    channel = supabase
      .channel("customer-bookings-subscription")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          console.log('[Customer Bookings] Realtime update:', payload);
          loadBookings();
        }
      )
      .subscribe((status) => {
        console.log('[Customer Bookings] Realtime subscription status:', status);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, customerResolved]);

  const loadBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Use API endpoint to bypass RLS (custom auth users have auth.uid() = NULL)
    try {
      const { apiUrl } = await import("@/lib/apiClient");
      const res = await fetch(`${apiUrl}/customers/bookings`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const bookings = data.bookings || [];
        
        console.log('[Customer Bookings] API response:', JSON.stringify({
          found: bookings.length,
          bookingIds: bookings.map((b: any) => b.id),
        }, null, 2));
        
        // Apply filter
        let filteredBookings = bookings;
        if (filter !== "all") {
          if (filter === "upcoming") {
            filteredBookings = bookings.filter((b: any) => 
              b.status === "pending" || b.status === "confirmed"
            );
          } else {
            filteredBookings = bookings.filter((b: any) => b.status === filter);
          }
        }

        // Sort by created_at descending
        filteredBookings.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setBookings(filteredBookings);
        setLoading(false);
        // Mark customer as resolved after successful API call (customer was created if needed)
        setCustomerResolved(true);
        return;
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Customer Bookings] API error:', res.status, errorData);
        setBookings([]);
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('[Customer Bookings] Error calling API:', error);
      setBookings([]);
      setLoading(false);
      return;
    }

    // Note: Fallback Supabase query removed - API endpoint should always work
    // If API fails, bookings will be empty (RLS blocks direct Supabase queries for custom auth users)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('customer.nav.myBookings')}</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {["all", "upcoming", "pending", "confirmed", "cancelled", "completed"].map((f) => (
          <Link
            key={f}
            href={`/customer/bookings?filter=${f}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t(`bookings.${f}`) || f.charAt(0).toUpperCase() + f.slice(1)}
          </Link>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">{t('booking.noBookingsFound')}</p>
          <Link
            href="/customer/shops"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('shops.browseShops')} →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.shops?.name || t('common.unknown')}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {t(`status.${booking.status}`) || booking.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>{t('common.date')}:</strong>{" "}
                      {booking.start_time 
                        ? new Date(booking.start_time).toLocaleDateString()
                        : booking.date 
                        ? new Date(booking.date).toLocaleDateString()
                        : booking.booking_date 
                        ? new Date(booking.booking_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>{t('common.time')}:</strong>{" "}
                      {booking.start_time 
                        ? new Date(booking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : booking.time_slot || booking.booking_time || 'N/A'}
                    </p>
                    {booking.shops?.address && (
                      <p>
                        <strong>{t('common.address')}:</strong> {booking.shops.address}
                      </p>
                    )}
                    {booking.customer_name && (
                      <p>
                        <strong>{t('common.name')}:</strong> {booking.customer_name}
                      </p>
                    )}
                    {booking.customer_phone && (
                      <p>
                        <strong>{t('common.phone')}:</strong> {booking.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {(booking.payment_status === 'unpaid' || booking.payment_status === 'pending') && booking.shops?.id && (
                    <Link
                      href={`/book/${booking.shops.id}/payment?bookingId=${booking.id}`}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-center"
                    >
                      {t('booking.payNow')}
                    </Link>
                  )}
                  {booking.shops?.id && (
                    <Link
                      href={`/customer/messages?bookingId=${booking.id}`}
                      className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-center"
                    >
                      {t('messages.title')}
                    </Link>
                  )}
                  <Link
                    href={`/customer/shops/${booking.shops?.id}?bookingId=${booking.id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {t('common.viewDetails') || 'View Details'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <CustomerBookingsPageContent />
    </Suspense>
  );
}

