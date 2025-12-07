// Owner Dashboard - Overview Page
// Shows stats and quick actions

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import Link from 'next/link';
import { useAIConversation } from '@/lib/useAIConversation';

interface Claim {
  id: string;
  shop_id: string;
  status: string;
  staff_note?: string;
  created_at: string;
  updated_at: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  };
}

interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  customer_name?: string;
  service_name?: string;
}


export default function OwnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [shopVerificationStatus, setShopVerificationStatus] = useState<string>('unverified');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await Promise.all([
        loadClaims(),
        loadShop(),
        loadBookings(),
        loadUnreadMessages(),
      ]);
      
      // Load verification status after shop is loaded
      if (shop) {
        await loadShopVerificationStatus();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/my`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
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
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/bookings?owner=true`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        const allBookings = data.bookings || [];
        setBookings(allBookings);
        
        // Calculate today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todayCount = allBookings.filter((b: Booking) => 
          b.booking_date === today
        ).length;
        setTodayBookingsCount(todayCount);
        
        // Calculate pending bookings
        const pendingCount = allBookings.filter((b: Booking) => 
          b.status === 'pending' || b.status === 'awaiting_confirmation'
        ).length;
        setPendingBookingsCount(pendingCount);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };
  
  const loadUnreadMessages = async () => {
    if (!user?.id) return;
    try {
      // Load customer messages
      const customerRes = await fetch(`${apiUrl}/api/messages/customer/threads`, {
        headers: { 'x-user-id': user.id },
      });
      let customerUnread = 0;
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        // Count unread messages (simplified - would need proper unread tracking)
        customerUnread = customerData.threads?.length || 0;
      }
      
      // Load staff messages
      const staffRes = await fetch(`${apiUrl}/api/owner/messages/threads`, {
        headers: { 'x-user-id': user.id },
      });
      let staffUnread = 0;
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        staffUnread = staffData.threads?.length || 0;
      }
      
      setUnreadMessagesCount(customerUnread + staffUnread);
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  };
  
  const loadShopVerificationStatus = async () => {
    if (!user?.id || !shop?.id) return;
    try {
      const res = await fetch(`${apiUrl}/shops/${shop.id}`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        const shopData = data.shop || data;
        setShopVerificationStatus(
          shopData.is_verified ? 'verified' : 
          shopData.verification_status || 'unverified'
        );
      }
    } catch (error) {
      console.error('Error loading shop verification status:', error);
    }
  };


  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Find active claim (pending verification)
  const currentClaim = claims.find(c => 
    ['draft', 'submitted', 'pending', 'resubmission_required'].includes(c.status)
  ) || claims[0];
  
  // Determine dashboard state
  const hasShop = shop !== null;
  const hasPendingVerification = currentClaim && ['pending', 'submitted'].includes(currentClaim.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Today's Bookings</p>
            <p className="text-3xl font-bold">{todayBookingsCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Pending Bookings</p>
            <p className="text-3xl font-bold">{pendingBookingsCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Unread Messages</p>
            <p className="text-3xl font-bold">{unreadMessagesCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">Shop Status</p>
            <p className="text-lg font-semibold">
              {shopVerificationStatus === 'verified' ? '✅ Verified' : 
               shopVerificationStatus === 'pending' ? '⏳ Pending' : 
               '❌ Unverified'}
            </p>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shop Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Shop Status</h2>
            {hasShop ? (
              <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
                <h3 className="font-semibold text-green-900 mb-2">Shop Verified</h3>
                <p className="text-green-700">
                  Your shop is verified and active. You can manage bookings, services, and settings.
                </p>
                {shop && (
                  <p className="text-green-700 mt-1">
                    Shop: <span className="font-bold">{shop.name}</span>
                  </p>
                )}
                <Link href="/owner/shop-profile" className="mt-3 inline-block text-sm font-medium text-green-800 hover:text-green-900">
                  Manage Your Shop →
                </Link>
              </div>
            ) : hasPendingVerification ? (
              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <h3 className="font-semibold text-yellow-900 mb-2">Claim Under Review</h3>
                <p className="text-yellow-700">
                  Your shop claim is currently being reviewed by our staff.
                </p>
                {currentClaim && (
                  <>
                    <p className="text-yellow-700 mt-1">
                      Status: <span className="font-bold">{currentClaim.status}</span>
                    </p>
                    {currentClaim.shop && (
                      <p className="text-yellow-700 mt-1">
                        Shop: {currentClaim.shop.name}
                      </p>
                    )}
                  </>
                )}
                <Link
                  href="/owner/claim"
                  className="mt-3 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  View Claim Details →
                </Link>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Get Started</h3>
                <p className="text-blue-700 mb-3">
                  Claim a shop to start managing bookings and services.
                </p>
                <Link
                  href="/owner/claim"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Claim a Shop
                </Link>
              </div>
            )}
          </div>

          {/* AI Assistant Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Owner AI Assistant</h2>
            <AIAssistantCard shopId={shop?.id} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.booking_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No recent bookings</p>
          )}
          {bookings.length > 5 && (
            <div className="mt-4">
              <Link href="/owner/bookings" className="text-blue-600 hover:text-blue-800">
                View all bookings →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AI Assistant Card Component
function AIAssistantCard({ shopId }: { shopId?: string }) {
  const { user } = useAuth();
  const { messages, addMessage, saving } = useAIConversation({
    userType: 'owner',
    userId: user?.id || undefined,
    contextKey: 'owner_dashboard',
    shopId: shopId || undefined,
  });
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || saving) return;
    await addMessage('user', input);
    setInput('');
  };

  return (
    <div className="space-y-4">
      <div className="h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Ask me anything about managing your shop!</p>
        ) : (
          <div className="space-y-2">
            {messages.slice(-3).map((msg, idx) => (
              <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={msg.role === 'user' ? 'text-blue-600' : 'text-gray-700'}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
          placeholder="Ask a question..."
          disabled={saving}
        />
        <button
          onClick={handleSend}
          disabled={saving || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Send
        </button>
      </div>
      <Link href="/owner/ai" className="text-sm text-blue-600 hover:text-blue-800">
        Open full AI Assistant →
      </Link>
    </div>
  );
}
