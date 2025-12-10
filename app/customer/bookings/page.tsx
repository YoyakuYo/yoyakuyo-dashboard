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
    
    // Get customer_profile_id for subscription
    supabase
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!profile?.id) return;

        const channel = supabase
          .channel("customer-bookings-subscription")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "bookings",
              filter: `or(customer_profile_id.eq.${profile.id},customer_id.eq.${profile.id})`,
            },
            () => {
              loadBookings();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      });
  }, [user]);

  const loadBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    
    // First, try to find existing profile by customer_auth_id
    let { data: profile } = await supabase
      .from("customer_profiles")
      .select("id, email")
      .eq("customer_auth_id", user.id)
      .maybeSingle();

    // If no profile exists, try to create one
    if (!profile) {
      console.log("Customer profile not found, attempting to create one...");
      // Try to create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("customer_profiles")
        .insert({
          customer_auth_id: user.id,
          email: user.email || "",
          name: user.name || user.email?.split('@')[0] || "Customer",
        })
        .select("id, email")
        .single();

      if (createError) {
        console.error("Error creating customer profile:", createError);
        // If creation fails, try to find by email as fallback
        const { data: profileByEmail } = await supabase
          .from("customer_profiles")
          .select("id, email")
          .eq("email", user.email || "")
          .maybeSingle();
        
        profile = profileByEmail;
      } else {
        profile = newProfile;
        console.log("✅ Created customer profile:", profile?.id);
      }
    }

    if (!profile?.id) {
      console.warn("Customer profile not found for user:", user.id, "Attempting to load bookings without profile ID.");
    }

    // Try customer_profile_id first, then fallback to customer_id
    // Use separate queries and combine results for better reliability
    const [profileBookings, customerIdBookings] = await Promise.all([
      // Query by customer_profile_id
      supabase
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
        .eq("customer_profile_id", profile.id)
        .order("created_at", { ascending: false }),
      
      // Query by customer_id (fallback for legacy bookings)
      supabase
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
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false })
    ]);

    // Combine results and remove duplicates
    const allBookings = [
      ...(profileBookings.data || []),
      ...(customerIdBookings.data || []).filter(
        (b: any) => !profileBookings.data?.some((pb: any) => pb.id === b.id)
      )
    ];

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

    if (profileBookings.error) {
      console.error("Error loading bookings by customer_profile_id:", profileBookings.error);
    }
    if (customerIdBookings.error) {
      console.error("Error loading bookings by customer_id:", customerIdBookings.error);
    }

    console.log(`[Customer Bookings] Found ${filteredBookings.length} bookings for customer_profile_id: ${profile.id}`);
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
                      {booking.shops?.name || "Unknown Shop"}
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
                      Pay Now
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

