"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  shops?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  services?: {
    id: string;
    name: string;
    price?: number;
  };
}

export default function GuestBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const t = useTranslations();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError(t('booking.bookingNotFound') || 'Booking not found');
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            id,
            customer_name,
            customer_email,
            customer_phone,
            start_time,
            end_time,
            status,
            notes,
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
          .eq('id', bookingId)
          .single();

        if (fetchError) {
          console.error('Error loading booking:', fetchError);
          setError(t('booking.bookingNotFound') || 'Booking not found');
        } else if (data) {
          setBooking(data as Booking);
        } else {
          setError(t('booking.bookingNotFound') || 'Booking not found');
        }
      } catch (err) {
        console.error('Error loading booking:', err);
        setError(t('booking.errorLoadingBooking') || 'Error loading booking');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, t]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t('bookings.pending') || 'Pending',
      confirmed: t('bookings.confirmed') || 'Confirmed',
      cancelled: t('bookings.cancelled') || 'Cancelled',
      completed: t('bookings.completed') || 'Completed',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('booking.bookingNotFound') || 'Booking Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || (t('booking.bookingNotFoundDesc') || 'The booking you are looking for could not be found.')}
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t('common.backToHome') || 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('booking.bookingDetails') || 'Booking Details'}
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          <div className="space-y-6">
            {/* Booking Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('booking.bookingInformation') || 'Booking Information'}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('common.date') || 'Date'}</p>
                  <p className="text-gray-900 font-medium">{formatDate(booking.start_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('common.time') || 'Time'}</p>
                  <p className="text-gray-900 font-medium">
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </p>
                </div>
                {booking.services && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('booking.service') || 'Service'}</p>
                    <p className="text-gray-900 font-medium">
                      {booking.services.name}
                      {booking.services.price && ` (${booking.services.price}¥)`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('booking.customerInformation') || 'Customer Information'}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('common.name') || 'Name'}</p>
                  <p className="text-gray-900 font-medium">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('common.email') || 'Email'}</p>
                  <p className="text-gray-900 font-medium">{booking.customer_email}</p>
                </div>
                {booking.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.phone') || 'Phone'}</p>
                    <p className="text-gray-900 font-medium">{booking.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shop Information */}
            {booking.shops && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('booking.shopInformation') || 'Shop Information'}
                </h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('shops.shopName') || 'Shop Name'}</p>
                    <p className="text-gray-900 font-medium">{booking.shops.name}</p>
                  </div>
                  {booking.shops.address && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('common.address') || 'Address'}</p>
                      <p className="text-gray-900">{booking.shops.address}</p>
                    </div>
                  )}
                  {booking.shops.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('common.phone') || 'Phone'}</p>
                      <p className="text-gray-900">{booking.shops.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('booking.notes') || 'Notes'}
                </h2>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
              >
                {t('common.backToHome') || 'Back to Home'}
              </Link>
              <Link
                href="/guest-booking"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                {t('booking.makeAnotherBooking') || 'Make Another Booking'}
              </Link>
            </div>

            {/* Login/Signup Prompt */}
            <div className="pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">
                {t('booking.wantToManageBookings') || 'Want to manage all your bookings in one place?'}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/customer-login"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {t('auth.signIn') || 'Sign In'}
                </Link>
                <span className="text-gray-400">|</span>
                <Link
                  href="/customer-signup"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {t('auth.signUp') || 'Sign Up'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

