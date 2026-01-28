"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";
import { useBookingNotifications } from "@/app/components/BookingNotificationContext";
import Link from "next/link";

// Format date helper
const formatDate = (dateString: string | null | undefined, naLabel: string) => {
  if (!dateString) return naLabel;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getTime() === 0) {
      return naLabel;
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return naLabel;
  }
};

// Format time helper
const formatTime = (timeSlot: string | null | undefined, startTime: string | null | undefined, naLabel: string) => {
  if (startTime) {
    try {
      const date = new Date(startTime);
      if (!isNaN(date.getTime()) && date.getTime() !== 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
      }
    } catch {
      // Fall through to time_slot
    }
  }
  if (timeSlot) {
    if (timeSlot.includes('T')) {
      try {
        const date = new Date(timeSlot);
        if (!isNaN(date.getTime()) && date.getTime() !== 0) {
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });
        }
      } catch {
        // Return as-is if parsing fails
      }
    }
    return timeSlot;
  }
  return naLabel;
};

interface Booking {
  id: string;
  shop_id: string;
  service_id: string;
  staff_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  source?: 'guest' | 'line';
  date?: string | null;
  booking_date?: string | null;
  time_slot?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'awaiting_confirmation' | 'reschedule_requested';
  payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed' | null;
  notes?: string | null;
  created_at: string;
  shops?: { id: string; name: string } | null;
  services?: { id: string; name: string; price?: number } | null;
  conversations?: { id: string }[] | null;
  conversation_id?: string | null;
}

const getCustomerTypeLabel = (booking: Booking, labels: { line: string; guest: string }) => {
  if (booking.source === 'line') return labels.line;
  if (booking.source === 'guest') return labels.guest;
  return booking.customer_email ? labels.guest : labels.line;
};

export default function OwnerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const { reloadPendingCount } = useBookingNotifications();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user?.id) {
      loadBookings();
    }
  }, [user, authLoading, router, filter]);

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // API filters by x-user-id header to get owner's bookings
      const res = await fetch(`${apiUrl}/bookings`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Handle both array response and object with bookings property
        const bookingsArray = Array.isArray(data) 
          ? data 
          : (data.bookings || []);
        setBookings(bookingsArray);
      } else {
        console.error('Failed to load bookings:', res.status);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!user?.id) {
      console.error('[Booking Status Update] No user ID available');
      alert('You must be logged in to update booking status.');
      return;
    }
    
    console.log('[Booking Status Update] Attempting to update:', {
      bookingId,
      newStatus,
      userId: user.id,
      apiUrl: `${apiUrl}/bookings/${bookingId}/status`
    });
    
    try {
      const res = await fetch(`${apiUrl}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('[Booking Status Update] Response:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      });

      if (res.ok) {
        await loadBookings();
        // Also update the notification count in the sidebar
        await reloadPendingCount();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update booking status' }));
        console.error('[Booking Status Update] Error response:', {
          status: res.status,
          error: errorData
        });
        alert(errorData.error || `Failed to update booking status: ${res.status}`);
      }
    } catch (error) {
      console.error("[Booking Status Update] Network error:", error);
      alert('Network error: Failed to update booking status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
      case "awaiting_confirmation":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const naLabel = t('common.na');
  const customerTypeLabels = {
    line: t('common.line'),
    guest: t('common.guest'),
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('nav.bookings')}</h1>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === status
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t(`bookings.${status}`) || status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">{t('booking.noBookingsFound')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
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
                      {formatDate(booking.booking_date || booking.date || booking.start_time, naLabel)}
                    </p>
                    <p>
                      <strong>{t('common.time')}:</strong>{" "}
                      {formatTime(booking.time_slot, booking.start_time, naLabel)}
                    </p>
                    {booking.services?.name && (
                      <p>
                        <strong>{t('booking.service')}:</strong> {booking.services.name}
                        {booking.services.price && (
                          <span className="ml-2">¥{booking.services.price.toLocaleString()}</span>
                        )}
                      </p>
                    )}
                    {booking.customer_name && (
                      <p>
                        <strong>{t('common.name')}:</strong> {booking.customer_name}
                      </p>
                    )}
                    <p>
                      <strong>{t('common.type')}:</strong> {getCustomerTypeLabel(booking, customerTypeLabels)}
                    </p>
                    {booking.customer_email && (
                      <p>
                        <strong>{t('common.email')}:</strong> {booking.customer_email}
                      </p>
                    )}
                    {booking.customer_phone && (
                      <p>
                        <strong>{t('common.phone')}:</strong> {booking.customer_phone}
                      </p>
                    )}
                    {booking.notes && (
                      <p>
                        <strong>{t('booking.notes')}:</strong> {booking.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {booking.status === 'pending' || booking.status === 'awaiting_confirmation' ? (
                    <>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('myShop.confirmBooking')}
                      </button>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        {t('myShop.rejectBooking')}
                      </button>
                    </>
                  ) : null}
                  {(booking.conversations && booking.conversations.length > 0 || booking.conversation_id) && (
                    <Link
                      href={`/owner/messages?conversation=${booking.conversations && booking.conversations.length > 0 ? booking.conversations[0].id : booking.conversation_id}`}
                      className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-center"
                      onClick={() => console.log('Message button clicked for booking:', booking.id, 'conversations:', booking.conversations, 'conversation_id:', booking.conversation_id)}
                    >
                      {t('messages.title')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

