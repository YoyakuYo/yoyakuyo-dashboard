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
  const { setUnreadBookingsCount } = useCustomerNotifications();

  useEffect(() => {
    if (user) {
      loadBookings();
      // Reset notification dot when customer opens bookings page
      setUnreadBookingsCount(0);
    }
  }, [user, filter, setUnreadBookingsCount]);

  // Subscribe to real-time booking updates
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    
    // Subscribe to bookings by canonical user_id
    const channel = supabase
      .channel("customer-bookings-subscription")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id.eq.${user.id}`,
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    
    // CRITICAL: user.id from useCustomAuth() IS the canonical users.id
    // Query bookings for both 'line' and 'user' booking types (web users can have both)
    const canonicalUserId = user.id;
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        shops (
          id,
          name,
          address,
          phone
        ),
        services (
          id,
          name,
          price
        )
      `)
      .in("booking_type", ["line", "user"]) // Show both LINE and web user bookings
      .eq("user_id", canonicalUserId)
      .order("created_at", { ascending: false });
    
    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      setBookings([]);
      setLoading(false);
      return;
    }
    
    const allBookings = bookings || [];

    // Apply filter
    let filteredBookings = allBookings;
    if (filter !== "all") {
      if (filter === "upcoming") {
        filteredBookings = allBookings.filter((b: any) => 
          b.status === "pending" || b.status === "confirmed"
        );
      } else {
        filteredBookings = allBookings.filter((b: any) => b.status === filter);
      }
    }

    // Sort by created_at descending
    filteredBookings.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    if (bookingsError) {
      console.error("Error loading bookings:", bookingsError);
    }

    // DEBUG ASSERTION: Check for orphaned bookings
    // If there are bookings for line_user_id but not for canonical user_id, log error
    if (allBookings.length === 0) {
      // Check if there are any bookings that might belong to this user but have wrong user_id
      const { data: orphanedCheck } = await supabase
        .from("bookings")
        .select("id, user_id, customer_profile_id")
        .eq("customer_profile_id", user.id)
        .limit(1)
        .maybeSingle();
      
      if (orphanedCheck) {
        console.error(`[Customer Bookings] ❌ ORPHANED BOOKING DETECTED!`);
        console.error(`[Customer Bookings] ❌ Booking ${orphanedCheck.id} has customer_profile_id=${orphanedCheck.customer_profile_id} but user_id=${orphanedCheck.user_id}`);
        console.error(`[Customer Bookings] ❌ Dashboard user_id=${canonicalUserId} does not match booking.user_id`);
        console.error(`[Customer Bookings] ❌ This booking will NOT appear in dashboard!`);
      }
    }
    
    console.log(`[Customer Bookings] Found ${allBookings.length} bookings for canonical user_id: ${canonicalUserId}`);
    setBookings(filteredBookings);
    setLoading(false);
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
                    href={`/customer/bookings/${booking.id}`}
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

