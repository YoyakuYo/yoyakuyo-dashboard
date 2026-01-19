"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { apiUrl } from '@/lib/apiClient';

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic';

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'active' | 'not_active' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('Checking subscription status...');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
  }, [user, loading, router, searchParams]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // ~60s at 3s interval

    const check = async () => {
      attempts += 1;
      try {
        const res = await fetch(`${apiUrl}/subscriptions/status/${user.id}`, {
          headers: { 'x-user-id': user.id },
          cache: 'no-store',
        });

        if (!res.ok) {
          setStatus('error');
          setStatusMessage(`Failed to check subscription status (${res.status})`);
          return;
        }

        const data = (await res.json()) as any;
        if (data?.isActive) {
          setStatus('active');
          setStatusMessage('Your subscription is active.');
          return;
        }

        if (attempts >= maxAttempts) {
          setStatus('not_active');
          setStatusMessage('Your subscription is still processing. Please wait a moment and refresh.');
          return;
        }

        setStatus('checking');
        setStatusMessage('Activating your subscription… this can take up to a minute.');
      } catch (e) {
        setStatus('error');
        setStatusMessage('Unexpected error while checking subscription status.');
      }
    };

    const interval = setInterval(() => {
      if (cancelled) return;
      void check();
    }, 3000);

    // run immediately
    void check();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {status === 'active' ? 'Subscription Active!' : 'Subscription Processing'}
          </h1>
          <p className="text-gray-600">
            {statusMessage}
          </p>
        </div>

        {sessionId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Session ID: <span className="font-mono text-xs">{sessionId}</span>
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/owner/subscription"
            className="inline-block w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Subscription Details
          </Link>
          <Link
            href="/shops"
            className="inline-block w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to My Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

