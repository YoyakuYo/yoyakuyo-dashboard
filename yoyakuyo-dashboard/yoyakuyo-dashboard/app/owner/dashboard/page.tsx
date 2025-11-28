// apps/dashboard/app/owner/dashboard/page.tsx
// Owner dashboard - redirects to My Shop

"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to My Shop
        router.replace('/shops');
      } else {
        // Not authenticated, redirect to login
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

