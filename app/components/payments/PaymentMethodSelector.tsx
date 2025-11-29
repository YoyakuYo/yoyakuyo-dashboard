"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface PaymentMethodSelectorProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onPaymentMethodSelected: (method: "stripe" | "linepay" | "paypay") => void;
}

export default function PaymentMethodSelector({
  bookingId,
  amount,
  currency = "JPY",
  onPaymentMethodSelected,
}: PaymentMethodSelectorProps) {
  const t = useTranslations();
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "linepay" | "paypay" | null>(null);

  const formatAmount = (amt: number, curr: string) => {
    if (curr === "JPY") {
      return `¥${Math.round(amt).toLocaleString()}`;
    }
    return `${curr} ${amt.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Payment Method</h2>
      <p className="text-gray-600 mb-6">
        Total Amount: <span className="font-bold text-lg">{formatAmount(amount, currency)}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stripe Payment */}
        <button
          onClick={() => {
            setSelectedMethod("stripe");
            onPaymentMethodSelected("stripe");
          }}
          className={`p-6 border-2 rounded-lg transition-all ${
            selectedMethod === "stripe"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-semibold text-gray-900 mb-1">Credit Card</h3>
            <p className="text-sm text-gray-600">Visa, Mastercard, Amex</p>
            <p className="text-xs text-gray-500 mt-2">Powered by Stripe</p>
          </div>
        </button>

        {/* LINE Pay */}
        <button
          onClick={() => {
            setSelectedMethod("linepay");
            onPaymentMethodSelected("linepay");
          }}
          className={`p-6 border-2 rounded-lg transition-all ${
            selectedMethod === "linepay"
              ? "border-green-600 bg-green-50"
              : "border-gray-300 hover:border-green-400"
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">💚</div>
            <h3 className="font-semibold text-gray-900 mb-1">LINE Pay</h3>
            <p className="text-sm text-gray-600">Pay with LINE account</p>
            <p className="text-xs text-gray-500 mt-2">Popular in Japan</p>
          </div>
        </button>

        {/* PayPay */}
        <button
          onClick={() => {
            setSelectedMethod("paypay");
            onPaymentMethodSelected("paypay");
          }}
          className={`p-6 border-2 rounded-lg transition-all ${
            selectedMethod === "paypay"
              ? "border-yellow-600 bg-yellow-50"
              : "border-gray-300 hover:border-yellow-400"
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-900 mb-1">PayPay</h3>
            <p className="text-sm text-gray-600">QR Code Payment</p>
            <p className="text-xs text-gray-500 mt-2">Scan & Pay</p>
          </div>
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Payment methods are configured via environment variables. 
          Please set the required API keys in your backend configuration.
        </p>
      </div>
    </div>
  );
}

