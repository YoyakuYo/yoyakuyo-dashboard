"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yoyakuyo.jp';

export default function RescheduleActionPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const tBooking = useTranslations('booking');
  const bookingId = params?.bookingId as string;
  const action = params?.action as string; // 'accept' or 'reject'
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !action) {
      setError(tBooking('rescheduleAction.invalidLink') || 'Invalid booking or action');
      setLoading(false);
      return;
    }

    if (action !== 'accept' && action !== 'reject') {
      setError(tBooking('rescheduleAction.invalidAction') || 'Invalid action. Must be "accept" or "reject"');
      setLoading(false);
      return;
    }

    const handleAction = async () => {
      try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/reschedule/${action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || tBooking('rescheduleAction.actionFailed') || 'Failed to process your response');
          setLoading(false);
          return;
        }

        setSuccess(true);
        setMessage(data.message || (action === 'accept' 
          ? (tBooking('rescheduleAction.acceptSuccess') || 'You have accepted the rescheduled booking time.')
          : (tBooking('rescheduleAction.rejectSuccess') || 'You have rejected the rescheduled booking time. The shop will contact you to find a better time.')));
        setLoading(false);
      } catch (err: any) {
        console.error('Error processing action:', err);
        setError(err.message || tBooking('rescheduleAction.unexpectedError') || 'An error occurred while processing your response');
        setLoading(false);
      }
    };

    handleAction();
  }, [bookingId, action, tBooking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{tBooking('rescheduleAction.processing') || 'Processing your response...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('common.error') || 'Error'}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">{action === 'accept' ? '✅' : '⚠️'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {action === 'accept' 
              ? (tBooking('rescheduleAction.acceptTitle') || 'Booking Accepted')
              : (tBooking('rescheduleAction.rejectTitle') || 'Booking Rejected')}
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('common.backToHome') || 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

