// Owner Dashboard - Overview Page
// Shows stats and quick actions

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import Link from 'next/link';
// AI conversation hook removed
import FloatingHelpButton from '../../components/FloatingHelpButton';
import { useTranslations } from 'next-intl';

interface Claim {
  id: string;
  shop_id: string;
  status: string;
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
  booking_date?: string;
  booking_time?: string;
  start_time?: string;
  date?: string;
  status: string;
  customer_name?: string;
  service_name?: string;
}


export default function OwnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [shopVerificationStatus, setShopVerificationStatus] = useState<string>('unverified');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      checkUserRole();
    }
  }, [user, authLoading, router]);

  const checkUserRole = async () => {
    if (!user?.id) return;
    
    setRoleLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role || data.role;
        setUserRole(role);
        
        // Only allow owner role
        if (role !== 'owner') {
          console.error('Access denied: User role is not owner', role);
          router.push('/login');
          return;
        }
        
        // User is authorized owner - load data
        loadData();
      } else {
        console.error('Failed to verify user role');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      router.push('/login');
    } finally {
      setRoleLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load verification status when shop is available
  useEffect(() => {
    if (shop?.id && user?.id) {
      loadShopVerificationStatus();
    }
  }, [shop?.id, user?.id]);

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
        const todayCount = allBookings.filter((b: Booking) => {
          // Check both booking_date and start_time fields
          const bookingDate = b.booking_date || (b.start_time ? b.start_time.split('T')[0] : null);
          return bookingDate === today;
        }).length;
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
      // Use the proper unread summary endpoint for owners
      const res = await fetch(`${apiUrl}/messages/owner/unread-summary`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessagesCount(data.unreadCount || 0);
      } else {
        console.error('Failed to load unread messages:', res.status);
        setUnreadMessagesCount(0);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
      setUnreadMessagesCount(0);
    }
  };
  
  const loadShopVerificationStatus = async () => {
    if (!user?.id) return;
    try {
      // Check owner_verification table directly (source of truth)
      const verificationRes = await fetch(`${apiUrl}/api/owner/claims/my`, {
        headers: { 'x-user-id': user.id },
      });
      if (verificationRes.ok) {
        const verificationData = await verificationRes.json();
        const verifications = verificationData.claims || [];
        
        // Find verification for current shop (if shop is loaded) or any approved verification
        let shopVerification = null;
        if (shop?.id) {
          shopVerification = verifications.find((v: any) => v.shop_id === shop.id);
        } else {
          // If no shop loaded yet, check for any approved verification
          shopVerification = verifications.find((v: any) => 
            v.status === 'approved' || v.verification_status === 'approved'
          );
        }
        
        if (shopVerification) {
          // The API returns both 'status' (mapped from verification_status) and 'verification_status'
          // Check both fields to be safe
          const status = shopVerification.status || shopVerification.verification_status;
          console.log('Found verification:', { 
            shop_id: shopVerification.shop_id, 
            status, 
            verification_status: shopVerification.verification_status 
          });
          
          if (status === 'approved') {
            setShopVerificationStatus('verified');
            return;
          } else if (status === 'pending' || status === 'submitted') {
            setShopVerificationStatus('pending');
            return;
          } else {
            setShopVerificationStatus('unverified');
            return;
          }
        } else {
          console.log('No verification found for shop:', shop?.id, 'All verifications:', verifications);
        }
      } else {
        console.error('Failed to fetch verifications:', await verificationRes.text());
      }
      
      // Fallback: Check shop data if shop is loaded
      if (shop?.id) {
        const res = await fetch(`${apiUrl}/shops/${shop.id}`, {
          headers: { 'x-user-id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          const shopData = data.shop || data;
          console.log('Shop data fallback:', { 
            is_verified: shopData.is_verified, 
            verification_status: shopData.verification_status 
          });
          // Check both is_verified and verification_status
          if (shopData.is_verified === true || shopData.verification_status === 'approved') {
            setShopVerificationStatus('verified');
            return;
          } else if (shopData.verification_status === 'pending') {
            setShopVerificationStatus('pending');
            return;
          }
        }
      }
      
      // Default to unverified if nothing found
      console.log('Setting status to unverified (no approved verification found)');
      setShopVerificationStatus('unverified');
    } catch (error) {
      console.error('Error loading shop verification status:', error);
      setShopVerificationStatus('unverified');
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
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">{t('dashboard.todaysBookings')}</p>
            <p className="text-3xl font-bold">{todayBookingsCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">{t('dashboard.pendingBookings')}</p>
            <p className="text-3xl font-bold">{pendingBookingsCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">{t('dashboard.unreadMessages')}</p>
            <p className="text-3xl font-bold">{unreadMessagesCount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-2">{t('dashboard.shopStatus')}</p>
            <p className="text-lg font-semibold">
              {shopVerificationStatus === 'verified' ? `✅ ${t('dashboard.verified')}` : 
               shopVerificationStatus === 'pending' ? `⏳ ${t('dashboard.pending')}` : 
               `❌ ${t('dashboard.unverified')}`}
            </p>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shop Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.shopStatus')}</h2>
            {shopVerificationStatus === 'verified' && hasShop ? (
              <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded">
                <h3 className="font-semibold text-green-900 mb-2">{t('dashboard.shopVerified')}</h3>
                <p className="text-green-700">
                  {t('dashboard.shopVerifiedDesc')}
                </p>
                {shop && (
                  <p className="text-green-700 mt-1">
                    {t('dashboard.shop')}: <span className="font-bold">{shop.name}</span>
                  </p>
                )}
                <Link href="/owner/shop-profile" className="mt-3 inline-block text-sm font-medium text-green-800 hover:text-green-900">
                  {t('dashboard.manageYourShop')} →
                </Link>
              </div>
            ) : (shopVerificationStatus === 'pending' || hasPendingVerification) ? (
              <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <h3 className="font-semibold text-yellow-900 mb-2">{t('dashboard.claimUnderReview')}</h3>
                <p className="text-yellow-700">
                  {t('dashboard.claimUnderReviewDesc')}
                </p>
                {currentClaim && (
                  <>
                    <p className="text-yellow-700 mt-1">
                      {t('dashboard.status')}: <span className="font-bold">{currentClaim.status}</span>
                    </p>
                    {currentClaim.shop && (
                      <p className="text-yellow-700 mt-1">
                        {t('dashboard.shop')}: {currentClaim.shop.name}
                      </p>
                    )}
                  </>
                )}
                <Link
                  href="/owner/claim"
                  className="mt-3 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900"
                >
                  {t('dashboard.viewClaimDetails')} →
                </Link>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">{t('dashboard.getStarted')}</h3>
                <p className="text-blue-700 mb-3">
                  {t('dashboard.getStartedDesc')}
                </p>
                <Link
                  href="/owner/claim"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('dashboard.claimAShop')}
                </Link>
              </div>
            )}
          </div>

          {/* AI Assistant removed - no longer available */}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.recentActivity')}</h2>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.time')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('myShop.customer')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.booking_date 
                          ? new Date(booking.booking_date).toLocaleDateString()
                          : booking.start_time
                          ? new Date(booking.start_time).toLocaleDateString()
                          : booking.date
                          ? new Date(booking.date).toLocaleDateString()
                          : t('dashboard.na')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.booking_time || 
                         (booking.start_time ? new Date(booking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : t('dashboard.na'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.customer_name || t('dashboard.na')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`status.${booking.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">{t('dashboard.noRecentBookings')}</p>
          )}
          {bookings.length > 5 && (
            <div className="mt-4">
              <Link href="/owner/bookings" className="text-blue-600 hover:text-blue-800">
                {t('dashboard.viewAllBookings')} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Help Button */}
      <FloatingHelpButton shopId={shop?.id} />
    </div>
  );
}

// AI Assistant Card component removed
