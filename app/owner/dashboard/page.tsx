// app/owner/dashboard/page.tsx
// Owner dashboard overview with verification status

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import Link from 'next/link';

interface Shop {
  id: string;
  name: string;
  verification_status?: string;
  subscription_plan?: string;
  booking_enabled?: boolean;
  ai_enabled?: boolean;
}

interface Verification {
  id: string;
  shop_id: string;
  verification_status: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  };
  document_count?: number;
}

interface OwnerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  verification_id?: string;
  shop_id?: string;
}

interface DashboardStats {
  todayBookings: number;
  totalBookings: number;
  unreadMessages: number;
  pendingVerification: boolean;
}

export default function OwnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadVerification();
      loadShop();
      loadStats();
      loadNotifications();
    }
  }, [user, authLoading, router]);

  const loadVerification = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/owner-verification/current`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setVerification(data);
      } else if (res.status === 404) {
        // No verification found - this is OK, user can create one
        setVerification(null);
      }
    } catch (error) {
      console.error('Error loading verification:', error);
      setVerification(null);
    }
  };

  const loadShop = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setShop(data.shops[0]);
        } else {
          // No shop found - but check if there's a verification/claim first
          // Don't redirect if verification exists (user is in claim process)
          if (!verification) {
            router.push('/owner/create-shop');
          }
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/owner/dashboard/stats`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats if API fails
      setStats({
        todayBookings: 0,
        totalBookings: 0,
        unreadMessages: 0,
        pendingVerification: shop?.verification_status === 'pending',
      });
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/owner-verification/notifications?limit=10`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no shop and no verification, will redirect (handled in loadShop)
  if (!shop && !verification) {
    return null;
  }

  // Determine verification status from verification record or shop
  const verificationStatus = verification?.verification_status || shop?.verification_status || 'not_submitted';
  const subscriptionPlan = shop?.subscription_plan || 'free';

  const getVerificationBanner = () => {
    // Show resubmission required banner
    if (verificationStatus === 'resubmission_required') {
      return (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-orange-400 text-xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Resubmission Required</strong>
              </p>
              <p className="mt-1 text-sm text-orange-600">
                Your identity verification needs additional documents. Please check the verification section and upload the requested documents.
              </p>
              <Link href="/owner/claim" className="mt-2 inline-block text-sm font-medium text-orange-800 hover:text-orange-900">
                Upload Documents →
              </Link>
            </div>
          </div>
        </div>
      );
    } else if (verificationStatus === 'draft') {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-xl">📝</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Complete Your Verification</strong>
              </p>
              <p className="mt-1 text-sm text-blue-600">
                You've started the verification process. Please upload at least one document to complete your submission.
              </p>
              <Link href="/owner/claim" className="mt-2 inline-block text-sm font-medium text-blue-800 hover:text-blue-900">
                Upload Documents →
              </Link>
            </div>
          </div>
        </div>
      );
    } else if (verificationStatus === 'pending') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Your shop is under review.</strong> Verification status: <strong>PENDING</strong>
              </p>
              <p className="mt-1 text-sm text-yellow-600">
                We're reviewing your shop and documents. You'll be notified once verification is complete.
              </p>
            </div>
          </div>
        </div>
      );
    } else if (verificationStatus === 'rejected') {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Verification Rejected</strong>
              </p>
              <p className="mt-1 text-sm text-red-600">
                Your shop verification was rejected. Please review the feedback and resubmit.
              </p>
              <Link href="/owner/verification" className="mt-2 inline-block text-sm font-medium text-red-800 hover:text-red-900">
                View Details →
              </Link>
            </div>
          </div>
        </div>
      );
    } else if (verificationStatus === 'not_submitted' && !verification) {
      // Only show "Create Shop" if there's no verification/claim at all
      return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Complete Your Shop Setup</strong>
              </p>
              <p className="mt-1 text-sm text-blue-600">
                Submit your shop for verification to enable online booking and AI features.
              </p>
              <Link href="/owner/claim" className="mt-2 inline-block text-sm font-medium text-blue-800 hover:text-blue-900">
                Claim a Shop →
              </Link>
            </div>
          </div>
        </div>
      );
    } else if (verificationStatus === 'approved' && subscriptionPlan === 'free') {
      return (
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-purple-400 text-xl">💳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-purple-700">
                <strong>Activate Subscription to Enable Features</strong>
              </p>
              <p className="mt-1 text-sm text-purple-600">
                Your shop is verified! Activate a subscription to enable online booking and AI assistant.
              </p>
              <Link href="/owner/subscription" className="mt-2 inline-block text-sm font-medium text-purple-800 hover:text-purple-900">
                View Plans →
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Dashboard
          {verification?.shop?.name && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {verification.shop.name}
            </span>
          )}
          {shop?.name && !verification?.shop?.name && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {shop.name}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
            <span className="text-sm text-gray-600">Unread notifications</span>
          </div>
        )}
      </div>

      {/* Verification Status Banner */}
      {getVerificationBanner()}

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="ml-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {notifications.length > 5 && (
            <Link
              href="/owner/notifications"
              className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications →
            </Link>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verification Status</p>
              <p className="text-2xl font-bold mt-2">
                {verificationStatus === 'approved' ? '✅ Approved' : 
                 verificationStatus === 'pending' ? '⏳ Pending' :
                 verificationStatus === 'rejected' ? '❌ Rejected' : '📝 Not Submitted'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subscription Plan</p>
              <p className="text-2xl font-bold mt-2 capitalize">{subscriptionPlan}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold mt-2">{stats?.todayBookings || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Status</p>
              <p className="text-2xl font-bold mt-2">
                {shop?.ai_enabled ? '✅ Enabled' : '🔒 Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/bookings"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-medium">View Bookings</div>
          </Link>
          <Link
            href="/owner/verification"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium">Verification</div>
          </Link>
          <Link
            href="/owner/subscription"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">💳</div>
            <div className="font-medium">Subscription</div>
          </Link>
          <Link
            href="/owner/shop-profile"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <div className="text-2xl mb-2">🏪</div>
            <div className="font-medium">Shop Profile</div>
          </Link>
        </div>
      </div>

      {/* Feature Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Online Booking</span>
            <span className={shop?.booking_enabled ? 'text-green-600' : 'text-gray-400'}>
              {shop?.booking_enabled ? '✅ Enabled' : '🔒 Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">AI Assistant</span>
            <span className={shop?.ai_enabled ? 'text-green-600' : 'text-gray-400'}>
              {shop?.ai_enabled ? '✅ Enabled' : '🔒 Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Messages</span>
            <span className="text-green-600">✅ Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="font-medium">Analytics</span>
            <span className={verificationStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}>
              {verificationStatus === 'approved' ? '✅ Enabled' : '🔒 Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
