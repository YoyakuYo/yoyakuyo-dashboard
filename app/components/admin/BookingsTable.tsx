// Bookings management table component
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Booking {
  id: string;
  shop_id: string;
  customer_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes: string | null;
  created_at: string;
  shops?: {
    id: string;
    name: string;
    address?: string;
  };
  services?: {
    id: string;
    name: string;
    price: number;
  };
  customers?: {
    id: string;
    auth_user_id: string;
  };
}

interface BookingsTableProps {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
}

export default function BookingsTable({
  bookings,
  loading,
  onRefresh,
}: BookingsTableProps) {
  const t = useTranslations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  React.useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      setProcessingId(bookingId);
      const response = await fetch(`${apiUrl}/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.updateFailed") || "Failed to update booking"));
      }
    } catch (error: any) {
      console.error("Error updating booking:", error);
      alert(error.message || (t("admin.updateFailed") || "Failed to update booking"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t("admin.confirmCancelBooking") || "Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setProcessingId(bookingId);
      const response = await fetch(`${apiUrl}/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        onRefresh();
        setShowCancelModal(null);
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.cancelFailed") || "Failed to cancel booking"));
      }
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      alert(error.message || (t("admin.cancelFailed") || "Failed to cancel booking"));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noBookingsFound") || "No bookings found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.bookingId") || "Booking ID"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.shop") || "Shop"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("booking.service") || "Service"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("booking.date") || "Date"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("booking.time") || "Time"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.status") || "Status"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("common.actions") || "Actions"}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {booking.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {booking.shops?.name || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {booking.services?.name || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {booking.booking_time || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status === 'confirmed' ? (t("bookings.confirmed") || "Confirmed") :
                   booking.status === 'completed' ? (t("bookings.completed") || "Completed") :
                   booking.status === 'cancelled' ? (t("bookings.cancelled") || "Cancelled") :
                   booking.status === 'rejected' ? (t("status.rejected") || "Rejected") :
                   (t("bookings.pending") || "Pending")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={processingId === booking.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {processingId === booking.id ? (t("common.loading") || "Loading...") : (t("admin.cancel") || "Cancel")}
                  </button>
                )}
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                    disabled={processingId === booking.id}
                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                  >
                    {t("admin.confirm") || "Confirm"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

