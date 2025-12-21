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
    
    // Get customer profile ID first
    const { data: customerProfile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", user.id)
      .maybeSingle();

    const customerProfileId = customerProfile?.id;

    // Query bookings - try customer_profile_id first, then user_id, then customer_id (for old bookings)
    // Handle case where customer_profile_id column might not exist yet
    let bookings: any[] = [];
    let bookingsError: any = null;

    // Query bookings by all possible fields and combine results
    // Try customer_profile_id, user_id, and customer_id separately, then merge
    const allBookings: any[] = [];
    const seenIds = new Set<string>();

    // Try customer_profile_id first
    if (customerProfileId) {
      try {
        const { data: profileData, error: profileError } = await supabase
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
          .eq("customer_profile_id", customerProfileId)
          .order("created_at", { ascending: false });

        console.log('[Customer Bookings] Query by customer_profile_id:', JSON.stringify({
          customerProfileId,
          found: profileData?.length || 0,
          error: profileError?.message || null,
          errorCode: profileError?.code || null,
          bookings: profileData?.map(b => ({ 
            id: b.id, 
            customer_profile_id: b.customer_profile_id, 
            user_id: b.user_id, 
            customer_id: b.customer_id,
            customer_name: b.customer_name,
            created_at: b.created_at
          })) || []
        }, null, 2));

        if (!profileError && profileData) {
          profileData.forEach(booking => {
            if (!seenIds.has(booking.id)) {
              allBookings.push(booking);
              seenIds.add(booking.id);
            }
          });
        }
      } catch (e) {
        console.error('[Customer Bookings] Error querying by customer_profile_id:', e);
      }
    }

    // Try user_id
    try {
      const { data: userData, error: userError } = await supabase
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log('[Customer Bookings] Query by user_id:', JSON.stringify({
        userId: user.id,
        found: userData?.length || 0,
        error: userError?.message || null,
        errorCode: userError?.code || null,
        bookings: userData?.map(b => ({ 
          id: b.id, 
          customer_profile_id: b.customer_profile_id, 
          user_id: b.user_id, 
          customer_id: b.customer_id,
          customer_name: b.customer_name,
          created_at: b.created_at
        })) || []
      }, null, 2));

      if (!userError && userData) {
        userData.forEach(booking => {
          if (!seenIds.has(booking.id)) {
            allBookings.push(booking);
            seenIds.add(booking.id);
          }
        });
      }
    } catch (e) {
      console.error('[Customer Bookings] Error querying by user_id:', e);
    }

    // Try customer_id (for old bookings)
    try {
      const { data: customerData, error: customerError } = await supabase
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
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      console.log('[Customer Bookings] Query by customer_id:', JSON.stringify({
        customerId: user.id,
        found: customerData?.length || 0,
        error: customerError?.message || null,
        errorCode: customerError?.code || null,
        bookings: customerData?.map(b => ({ 
          id: b.id, 
          customer_profile_id: b.customer_profile_id, 
          user_id: b.user_id, 
          customer_id: b.customer_id,
          customer_name: b.customer_name,
          created_at: b.created_at
        })) || []
      }, null, 2));

      if (!customerError && customerData) {
        customerData.forEach(booking => {
          if (!seenIds.has(booking.id)) {
            allBookings.push(booking);
            seenIds.add(booking.id);
          }
        });
      }
    } catch (e) {
      console.error('[Customer Bookings] Error querying by customer_id:', e);
    }

    // Sort by created_at descending
    allBookings.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Remove duplicates (in case a booking matches multiple conditions)
    const uniqueBookings = allBookings.filter((booking, index, self) =>
      index === self.findIndex((b) => b.id === booking.id)
    );
    
    bookings = uniqueBookings;
    bookingsError = null;
    
    console.log('[Customer Bookings] After all queries:', JSON.stringify({
      totalFound: allBookings.length,
      uniqueBookings: uniqueBookings.length,
      bookingIds: uniqueBookings.map(b => b.id),
      bookingsSummary: uniqueBookings.map(b => ({
        id: b.id,
        customer_id: b.customer_id,
        user_id: b.user_id,
        customer_profile_id: b.customer_profile_id,
        customer_name: b.customer_name,
        status: b.status
      }))
    }, null, 2));
    
    // DEBUG: Check what bookings actually exist in the database
    try {
      const { data: debugBookings, error: debugError } = await supabase
        .from("bookings")
        .select("id, customer_id, user_id, customer_profile_id, customer_name, shop_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      
      console.log('[Customer Bookings] DEBUG - Recent bookings in database:', JSON.stringify({
        totalFound: debugBookings?.length || 0,
        bookings: debugBookings?.map(b => ({
          id: b.id,
          customer_id: b.customer_id,
          user_id: b.user_id,
          customer_profile_id: b.customer_profile_id,
          customer_name: b.customer_name,
          shop_id: b.shop_id,
          created_at: b.created_at
        })) || []
      }, null, 2));
      
      // Check specifically for bookings matching our user
      const matchingBookings = debugBookings?.filter(b => 
        (b.customer_id && b.customer_id === user.id) || 
        (b.user_id && b.user_id === user.id) || 
        (b.customer_profile_id && b.customer_profile_id === customerProfileId)
      ) || [];
      
      console.log('[Customer Bookings] DEBUG - Bookings matching user:', JSON.stringify({
        searchCriteria: {
          userId: user.id,
          customerProfileId: customerProfileId,
          customerId: user.id
        },
        count: matchingBookings.length,
        bookings: matchingBookings.map(b => ({
          id: b.id,
          customer_id: b.customer_id,
          user_id: b.user_id,
          customer_profile_id: b.customer_profile_id,
          customer_name: b.customer_name,
          shop_id: b.shop_id,
          created_at: b.created_at
        }))
      }, null, 2));
    } catch (debugErr) {
      console.error('[Customer Bookings] DEBUG error:', debugErr);
    }
    
    console.log('[Customer Bookings] Found bookings:', JSON.stringify({
      customerProfileId,
      userId: user.id,
      totalBookings: bookings.length,
      byProfile: customerProfileId ? bookings.filter(b => b.customer_profile_id === customerProfileId).length : 0,
      byUserId: bookings.filter(b => b.user_id === user.id).length,
      byCustomerId: bookings.filter(b => b.customer_id === user.id).length,
      allBookingsIds: allBookings.map(b => b.id),
      finalBookingsIds: bookings.map(b => b.id)
    }, null, 2));
    
    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      setBookings([]);
      setLoading(false);
      return;
    }

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

    if (bookingsError) {
      console.error("Error loading bookings:", bookingsError);
    }

    // DEBUG ASSERTION: Check for orphaned bookings (only if customer_profile_id column exists)
    // Skip this check if we already fell back to user_id query
    if (bookings.length === 0 && customerProfileId && !bookingsError) {
      // Try to check for orphaned bookings, but handle case where column doesn't exist
      try {
        const { data: orphanedCheck, error: orphanedError } = await supabase
          .from("bookings")
          .select("id, user_id, customer_profile_id")
          .eq("customer_profile_id", customerProfileId)
          .limit(1)
          .maybeSingle();
        
        // If column doesn't exist, skip orphaned check
        if (orphanedError && (orphanedError.code === '42703' || orphanedError.message?.includes('does not exist'))) {
          // Column doesn't exist, skip check
        } else if (orphanedCheck) {
          console.error(`[Customer Bookings] ❌ ORPHANED BOOKING DETECTED!`);
          console.error(`[Customer Bookings] ❌ Booking ${orphanedCheck.id} has customer_profile_id=${orphanedCheck.customer_profile_id} but user_id=${orphanedCheck.user_id}`);
          console.error(`[Customer Bookings] ❌ Dashboard user_id=${user.id} does not match booking.user_id`);
          console.error(`[Customer Bookings] ❌ This booking will NOT appear in dashboard!`);
        }
      } catch (e) {
        // Silently ignore errors in debug check
      }
    }
    
    console.log(`[Customer Bookings] Found ${bookings.length} bookings for user_id: ${user.id}, customer_profile_id: ${customerProfileId || 'none'}`);
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

