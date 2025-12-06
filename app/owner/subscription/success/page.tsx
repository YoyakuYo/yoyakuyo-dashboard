"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

// Force dynamic rendering for this page (uses searchParams)
export const dynamic = 'force-dynamic';

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

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
    <div className="p-8 max-w-2xl mx-auto">
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
            Subscription Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for subscribing to Yoyaku Yo. Your subscription is now active.
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

