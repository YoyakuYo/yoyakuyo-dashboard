"use client";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface StripePaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({
  bookingId,
  amount,
  currency = "JPY",
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const t = useTranslations();

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${apiUrl}/payments/stripe/create-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_id: bookingId,
            amount: amount,
            currency: currency,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.client_secret);
      } catch (error: any) {
        onError(error.message || "Failed to initialize payment");
      }
    };

    createPaymentIntent();
  }, [bookingId, amount, currency, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setLoading(false);
      onError("Card element not found");
      return;
    }

    try {
      const { error: submitError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (submitError) {
        onError(submitError.message || "Payment failed");
        setLoading(false);
      } else {
        // Confirm payment on backend
        const confirmResponse = await fetch(`${apiUrl}/payments/stripe/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_intent_id: clientSecret.split("_secret")[0],
          }),
        });

        if (confirmResponse.ok) {
          onSuccess();
        } else {
          const errorData = await confirmResponse.json();
          onError(errorData.error || "Payment confirmation failed");
        }
        setLoading(false);
      }
    } catch (error: any) {
      onError(error.message || "Payment processing failed");
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processing..." : `Pay ${currency === "JPY" ? `¥${Math.round(amount).toLocaleString()}` : `${currency} ${amount.toFixed(2)}`}`}
      </button>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const options: StripeElementsOptions = {
    appearance: {
      theme: "stripe",
    },
  };

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}

