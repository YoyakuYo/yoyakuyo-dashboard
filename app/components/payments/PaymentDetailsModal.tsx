"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/apiClient";

interface Payment {
  id: string;
  payment_method: 'stripe' | 'linepay' | 'paypay';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transaction_id?: string | null;
  payment_intent_id?: string | null;
  metadata?: any;
  created_at: string;
  updated_at?: string;
}

interface PaymentDetailsModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentDetailsModal({
  bookingId,
  isOpen,
  onClose,
}: PaymentDetailsModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadPayments();
    }
  }, [isOpen, bookingId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/payments/booking/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns array of payments directly
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'stripe':
        return '💳 Credit Card (Stripe)';
      case 'linepay':
        return '💚 LINE Pay';
      case 'paypay':
        return '📱 PayPay';
      default:
        return method;
    }
  };

  const formatStatus = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No payment records found for this booking.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {formatPaymentMethod(payment.payment_method)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleString()}
                      </p>
                    </div>
                    {formatStatus(payment.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {payment.currency === 'JPY' 
                          ? `¥${Math.round(payment.amount).toLocaleString()}`
                          : `${payment.currency} ${payment.amount.toFixed(2)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-semibold text-gray-900 capitalize">
                        {payment.status}
                      </span>
                    </div>
                    {payment.transaction_id && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="ml-2 font-mono text-xs text-gray-700 break-all">
                          {payment.transaction_id}
                        </span>
                      </div>
                    )}
                    {payment.payment_intent_id && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Payment Intent ID:</span>
                        <span className="ml-2 font-mono text-xs text-gray-700 break-all">
                          {payment.payment_intent_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

