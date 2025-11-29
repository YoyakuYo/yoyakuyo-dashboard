"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";

interface PayPayQRCodeProps {
  bookingId: string;
  amount: number;
  productName: string;
  currency?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PayPayQRCode({
  bookingId,
  amount,
  productName,
  currency = "JPY",
  onSuccess,
  onError,
}: PayPayQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [deeplink, setDeeplink] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    createPayPayPayment();
  }, []);

  useEffect(() => {
    if (paymentId && !polling) {
      startPolling();
    }
  }, [paymentId]);

  const createPayPayPayment = async () => {
    try {
      const response = await fetch(`${apiUrl}/payments/paypay/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: bookingId,
          amount: amount,
          currency: currency,
          product_name: productName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create PayPay payment");
      }

      const data = await response.json();
      setQrCodeUrl(data.qr_code_url);
      setDeeplink(data.deeplink);
      setPaymentId(data.payment_id);
      setLoading(false);
    } catch (error: any) {
      onError(error.message || "PayPay payment creation failed");
      setLoading(false);
    }
  };

  const startPolling = () => {
    setPolling(true);
    const interval = setInterval(async () => {
      if (!paymentId) {
        clearInterval(interval);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/payments/paypay/status/${paymentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "COMPLETED") {
            clearInterval(interval);
            onSuccess();
          } else if (data.status === "FAILED" || data.status === "CANCELED") {
            clearInterval(interval);
            onError("Payment was cancelled or failed");
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 300000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Creating PayPay payment...</p>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 text-sm">Failed to generate PayPay QR code</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <img src={qrCodeUrl} alt="PayPay QR Code" className="w-64 h-64" />
      </div>
      <p className="text-sm text-gray-600 text-center">
        Scan this QR code with your PayPay app to complete payment
      </p>
      {deeplink && (
        <a
          href={deeplink}
          className="text-blue-600 hover:text-blue-700 text-sm underline"
        >
          Or open PayPay app directly
        </a>
      )}
      {polling && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Waiting for payment confirmation...</span>
        </div>
      )}
      {!process.env.NEXT_PUBLIC_PAYPAY_MERCHANT_ID && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Note: PayPay requires PAYPAY_MERCHANT_ID, PAYPAY_API_KEY, and PAYPAY_API_SECRET to be configured
        </p>
      )}
    </div>
  );
}

