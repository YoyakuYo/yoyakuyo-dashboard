"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// Web customer auth removed - guests don't need auth for payment
import { apiUrl } from "@/lib/apiClient";
import StripePaymentForm from "@/app/components/payments/StripePaymentForm";
import { useTranslations } from "next-intl";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  // No auth needed for guest payments
  const t = useTranslations();
  const shopId = params.shopId as string;

  const [booking, setBooking] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get booking from URL params, session storage, or fetch from API
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get("bookingId");
    
    if (bookingId) {
      // Fetch booking from API
      loadBookingFromApi(bookingId);
    } else {
      // Try session storage (for new bookings)
      const bookingData = sessionStorage.getItem("pendingBooking");
      if (bookingData) {
        const parsed = JSON.parse(bookingData);
        setBooking(parsed);
        loadServiceDetails(parsed.service_id);
        setLoading(false);
      } else {
        setError(t('payment.noBookingFound'));
        setLoading(false);
      }
    }
  }, []);

  const loadBookingFromApi = async (bookingId: string) => {
    try {
      const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
        headers: {
          // No user ID for guest payments
        },
      });
      
      if (response.ok) {
        const bookingData = await response.json();
        setBooking(bookingData);
        if (bookingData.service_id) {
          loadServiceDetails(bookingData.service_id);
        } else if (bookingData.services?.id) {
          loadServiceDetails(bookingData.services.id);
        }
      } else {
        setError("Failed to load booking details.");
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      setError("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  const loadServiceDetails = async (serviceId: string) => {
    try {
      const response = await fetch(`${apiUrl}/services/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setService(data);
      }
    } catch (error) {
      console.error("Error loading service:", error);
    }
  };

  const handlePaymentSuccess = () => {
    // Clear pending booking
    sessionStorage.removeItem("pendingBooking");
    // Redirect to booking confirmation
    router.push(`/customer/bookings?payment=success`);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/customer/shops/${shopId}`)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Go Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const amount = service?.price || 0;
  const productName = service?.name || "Booking";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('payment.completePayment')}</h1>

        {/* Booking Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('payment.bookingSummary')}</h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>{t('booking.service')}:</strong> {productName}</p>
            <p><strong>{t('common.date')}:</strong> {booking?.date || t('dashboard.na')}</p>
            <p><strong>{t('common.time')}:</strong> {booking?.time_slot || booking?.start_time || t('dashboard.na')}</p>
            <p><strong>{t('payment.amount')}:</strong> <span className="font-bold text-lg">¥{Math.round(amount).toLocaleString()}</span></p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <StripePaymentForm
            bookingId={booking?.id || ""}
            amount={amount}
            currency="JPY"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>

        {/* Configuration Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>{t('payment.configRequired')}:</strong> {t('payment.configRequiredDesc')}
            <br />
            <strong>Stripe:</strong> STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          </p>
        </div>
      </div>
    </div>
  );
}

