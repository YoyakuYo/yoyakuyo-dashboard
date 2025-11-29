"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";

interface LinePayButtonProps {
  bookingId: string;
  amount: number;
  productName: string;
  currency?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function LinePayButton({
  bookingId,
  amount,
  productName,
  currency = "JPY",
  onSuccess,
  onError,
}: LinePayButtonProps) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/payments/linepay/request`, {
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
        throw new Error(error.error || "Failed to create LINE Pay payment");
      }

      const data = await response.json();

      if (data.payment_url) {
        // Redirect to LINE Pay payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error: any) {
      onError(error.message || "LINE Pay payment failed");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>💚</span>
            <span>Pay with LINE Pay</span>
          </>
        )}
      </button>
      {!process.env.NEXT_PUBLIC_LINE_PAY_CHANNEL_ID && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Note: LINE Pay requires LINE_PAY_CHANNEL_ID and LINE_PAY_CHANNEL_SECRET to be configured
        </p>
      )}
    </div>
  );
}

