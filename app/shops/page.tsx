// apps/dashboard/app/my-shop/page.tsx
// "My Shop" page for owners to manage their shop

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import ReviewCard from '../components/ReviewCard';
import ReviewStats from '../components/ReviewStats';

// LINE QR Code Component
function LineQrSection({ shopId, shop, user }: { shopId: string; shop: Shop | null; user: any }) {
  const [connecting, setConnecting] = useState(false);

  const deeplinkUrl = shop?.line_destination_id 
    ? `https://line.me/R/ti/p/${shop.line_destination_id}`
    : null;

  const handleConnectLine = async () => {
    if (!user?.id || !shopId) return;

    try {
      setConnecting(true);
      const res = await fetch(`${apiUrl}/line/shop-auth-url?shopId=${shopId}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          // Redirect to LINE OAuth
          window.location.href = data.authUrl;
        } else {
          alert('Failed to get LINE OAuth URL');
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to connect LINE account');
      }
    } catch (error) {
      console.error('Error connecting LINE:', error);
      alert('Failed to connect LINE account');
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyLink = () => {
    if (deeplinkUrl) {
      navigator.clipboard.writeText(deeplinkUrl);
      alert('LINE link copied to clipboard!');
    }
  };

  const handleDownloadQr = () => {
    if (shop?.line_qr_code_url) {
      const link = document.createElement('a');
      link.href = shop.line_qr_code_url;
      link.download = `line-qr-${shopId}.png`;
      link.click();
    }
  };

  // Check for success/error messages in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('line_connected') === 'success') {
      alert('LINE account connected successfully!');
      // Remove query param
      window.history.replaceState({}, '', window.location.pathname);
      // Reload shop data
      window.location.reload();
    } else if (params.get('line_error')) {
      alert(`LINE connection error: ${params.get('line_error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!shop?.line_qr_code_url || !shop?.line_destination_id) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-gray-500">Connect LINE to generate QR code</p>
        <button
          onClick={handleConnectLine}
          disabled={connecting}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connecting ? 'Connecting...' : 'Connect LINE Account'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <img 
        src={shop.line_qr_code_url} 
        alt="LINE QR Code" 
        className="w-48 h-48 border-2 border-gray-300 rounded-lg" 
      />
      <p className="text-sm text-gray-600 text-center">LINEで予約はこちら</p>
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Copy LINE Link
        </button>
        <button
          onClick={handleDownloadQr}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Download QR Code
        </button>
      </div>
    </div>
  );
}

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  google_place_id?: string | null;
  city?: string | null;
  country?: string | null;
  zip_code?: string | null;
  description?: string | null;
  language_code?: string | null;
  line_qr_code_url?: string | null;
  line_destination_id?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: any | null;
  business_status?: string | null;
  category_id?: string | null;
  category?: string | null; // Computed from categories join
  subcategory?: string | null; // Computed field, not a column
  owner_user_id?: string | null;
  claim_status?: 'unclaimed' | 'pending' | 'approved' | 'rejected' | null;
  claimed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Service {
  id: string;
  shop_id?: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  duration?: number | null;
  is_active?: boolean;
}

interface Staff {
  id: string;
  shop_id?: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  is_active?: boolean;
}

interface Booking {
  id: string;
  shop_id?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  start_time: string;
  end_time: string;
  status?: string | null;
  services?: { name: string } | null;
}

const MyShopPage = () => {
  const { user, loading } = useAuth();
  const authLoading = Boolean(loading); // Ensure it's always a boolean for stable dependency array
  const router = useRouter();
  const t = useTranslations();

  const [shop, setShop] = useState<Shop | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'staff' | 'bookings' | 'photos' | 'reviews'>('overview');
  
  // Form states
  const [editingShop, setEditingShop] = useState(false);
  const [shopForm, setShopForm] = useState<Partial<Shop>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    google_place_id: '',
    city: '',
    country: '',
    zip_code: '',
    description: '',
    language_code: '',
  });
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [showClaimShop, setShowClaimShop] = useState(false);
  const [unclaimedShops, setUnclaimedShops] = useState<Shop[]>([]);
  const [claimLoading, setClaimLoading] = useState(false);

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [photos, setPhotos] = useState<Array<{ id: string; shop_id: string; type: string; url: string; created_at: string }>>([]);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [ownerResponse, setOwnerResponse] = useState<Record<string, string>>({});
  
  // Service form state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 0,
  });
  const [serviceError, setServiceError] = useState<string | null>(null);
  
  // Staff form state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });
  const [staffError, setStaffError] = useState<string | null>(null);

  // Booking status update state
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    newStatus: 'confirmed' | 'rejected' | null;
    bookingCustomerName: string | null;
  }>({
    isOpen: false,
    bookingId: null,
    newStatus: null,
    bookingCustomerName: null,
  });
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Cancel booking modal state
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    bookingCustomerName: string | null;
  }>({
    isOpen: false,
    bookingId: null,
    bookingCustomerName: null,
  });
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Reschedule booking modal state
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    bookingCustomerName: string | null;
    currentDateTime: string | null;
  }>({
    isOpen: false,
    bookingId: null,
    bookingCustomerName: null,
    currentDateTime: null,
  });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  
  // Photo upload toast notification
  const [photoToast, setPhotoToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch unclaimed shops when claim modal opens
  useEffect(() => {
    if (showClaimShop && user && !authLoading) {
      const fetchUnclaimedShops = async () => {
        try {
          setClaimLoading(true);
          const res = await fetch(`${apiUrl}/shops?unclaimed=true`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await res.json();
              setUnclaimedShops(Array.isArray(data) ? data : []);
            } else {
              console.error('Expected JSON but received:', contentType);
              setUnclaimedShops([]);
            }
          } else {
            console.error('Failed to fetch unclaimed shops:', res.status, res.statusText);
            setUnclaimedShops([]);
          }
        } catch (error: any) {
          // Silently handle connection errors (API server not running)
          if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
            console.error('Error fetching unclaimed shops:', error);
          }
          setUnclaimedShops([]);
        } finally {
          setClaimLoading(false);
        }
      };
      fetchUnclaimedShops();
    }
  }, [showClaimShop, user, authLoading, apiUrl]);

  // Fetch user's shop
  useEffect(() => {
    // Wait for auth to finish loading and ensure user exists with valid ID
    if (authLoading || !user || !user.id) {
      if (authLoading) {
        setPageLoading(true);
      } else if (!user) {
        setPageLoading(false);
      }
      return;
    }

    const fetchMyShop = async () => {
      try {
        setPageLoading(true);
        // Validate user.id is a valid UUID before making request
        if (!user.id || typeof user.id !== 'string' || user.id === 'undefined' || user.id === 'null') {
          console.error('Invalid user ID:', user.id);
          setShop(null);
          setShopForm({});
          setPageLoading(false);
          return;
        }

        // Fetch shops owned by user - backend filters by owner_user_id when my_shops=true
        const url = `${apiUrl}/shops?my_shops=true`;
        console.log('Fetching shop from:', url);
        console.log('User ID:', user.id);
        
        let res;
        try {
          res = await fetch(url, {
            headers: {
              'x-user-id': user.id,
              'Content-Type': 'application/json',
            },
          });
        } catch (fetchError: any) {
          // Handle connection errors gracefully
          if (fetchError?.message?.includes('Failed to fetch') || fetchError?.message?.includes('ERR_CONNECTION_REFUSED')) {
            // API server is not running - silently handle
            setShop(null);
            setShopForm({});
            setPageLoading(false);
            return;
          }
          throw fetchError;
        }
        
        if (res.status === 404) {
          // User owns no shop
          console.log('No shop found for user');
          setShop(null);
          setShopForm({});
          setPageLoading(false);
          return;
        }
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const response = await res.json();
            // Backend returns: { data: [...], pagination: {...} }
            const shopsArray = Array.isArray(response) 
              ? response 
              : (response.data && Array.isArray(response.data) 
                ? response.data 
                : []);
            if (shopsArray.length > 0) {
              // Use the first shop if multiple exist
              const userShop = shopsArray[0];
              setShop(userShop);
              setShopForm({
                name: userShop.name || '',
                address: userShop.address || '',
                phone: userShop.phone || '',
                email: userShop.email || '',
                website: userShop.website || '',
                google_place_id: userShop.google_place_id || '',
                city: userShop.city || '',
                country: userShop.country || '',
                zip_code: userShop.zip_code || '',
                description: userShop.description || '',
                language_code: userShop.language_code || '',
                category: userShop.category || null,
                subcategory: userShop.subcategory || null,
                logo_url: userShop.logo_url || null,
                cover_photo_url: userShop.cover_photo_url || null,
              });
              // Fetch related data
              fetchServices(userShop.id);
              fetchStaff(userShop.id);
              fetchBookings(userShop.id);
              fetchPhotos(userShop.id);
            } else {
              setShop(null);
              setShopForm({});
            }
          } else {
            console.error('Expected JSON but received:', contentType);
            setShop(null);
            setShopForm({});
          }
        } else {
          const errorText = await res.text().catch(() => 'Unknown error');
          console.error('Error fetching shop:', res.status, res.statusText, errorText);
          setShop(null);
          setShopForm({});
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error('Error fetching shop:', error);
        }
        setShop(null);
        setShopForm({});
      } finally {
        setPageLoading(false);
      }
    };

    fetchMyShop();
  }, [user, authLoading, apiUrl]);

  const fetchServices = async (shopId: string) => {
    if (!shopId || !user) return;
    try {
      const res = await fetch(`${apiUrl}/shops/${shopId}/services`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching services:', error);
      }
      setServices([]);
    }
  };

  const fetchStaff = async (shopId: string) => {
    if (!shopId || !user) return;
    try {
      const res = await fetch(`${apiUrl}/shops/${shopId}/staff`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching staff:', error);
      }
      setStaff([]);
    }
  };

  const fetchBookings = async (shopId: string) => {
    if (!shopId || !user) return;
    try {
      const res = await fetch(`${apiUrl}/bookings`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter to only this shop's bookings
        const shopBookings = Array.isArray(data) 
          ? data.filter((b: any) => b.shop_id === shopId)
          : [];
        setBookings(shopBookings);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching bookings:', error);
      }
      setBookings([]);
    }
  };

  const fetchPhotos = async (shopId: string) => {
    if (!shopId || !user) return;
    try {
      const res = await fetch(`${apiUrl}/shops/${shopId}/photos`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching photos:', error);
      }
      setPhotos([]);
    }
  };

  const fetchReviews = async (shopId: string) => {
    if (!shopId || !user) return;
    try {
      setLoadingReviews(true);
      const reviewsRes = await fetch(`${apiUrl}/reviews?shop_id=${shopId}`, {
        headers: { 'x-user-id': user.id },
      });
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }
      const statsRes = await fetch(`${apiUrl}/reviews/shop/${shopId}/stats`, {
        headers: { 'x-user-id': user.id },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setReviewStats(statsData);
      }
    } catch (error: any) {
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching reviews:', error);
      }
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOwnerResponse = async (reviewId: string, response: string) => {
    if (!user || !shop) return;
    try {
      const res = await fetch(`${apiUrl}/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ owner_response: response }),
      });
      if (res.ok) {
        await fetchReviews(shop.id);
        setOwnerResponse((prev) => ({ ...prev, [reviewId]: '' }));
      } else {
        alert('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting owner response:', error);
      alert('Failed to submit response');
    }
  };
  
  // Service handlers
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !user) return;
    
    setServiceError(null);
    try {
      const res = await fetch(`${apiUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          shop_id: shop.id,
          name: serviceForm.name,
          description: serviceForm.description,
          price: serviceForm.price,
          duration: serviceForm.duration_minutes,
        }),
      });
      
      if (res.ok) {
        await fetchServices(shop.id);
        setServiceForm({ name: '', description: '', price: 0, duration_minutes: 0 });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create service' }));
        setServiceError(errorData.error || 'Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      setServiceError('Failed to create service');
    }
  };
  
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !user || !editingService) return;
    
    setServiceError(null);
    try {
      const res = await fetch(`${apiUrl}/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: serviceForm.name,
          description: serviceForm.description,
          price: serviceForm.price,
          duration_minutes: serviceForm.duration_minutes,
        }),
      });
      
      if (res.ok) {
        await fetchServices(shop.id);
        setEditingService(null);
        setServiceForm({ name: '', description: '', price: 0, duration_minutes: 0 });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update service' }));
        setServiceError(errorData.error || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      setServiceError('Failed to update service');
    }
  };
  
  const handleDeleteService = async (serviceId: string) => {
    if (!shop || !user || !confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const res = await fetch(`${apiUrl}/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (res.ok) {
        await fetchServices(shop.id);
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };
  
  const startEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes || 0,
    });
  };
  
  // Staff handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !user) return;
    
    setStaffError(null);
    try {
      const res = await fetch(`${apiUrl}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          shop_id: shop.id,
          first_name: staffForm.first_name,
          last_name: staffForm.last_name,
          phone: staffForm.phone,
          email: staffForm.email,
        }),
      });
      
      if (res.ok) {
        await fetchStaff(shop.id);
        setStaffForm({ first_name: '', last_name: '', phone: '', email: '' });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create staff' }));
        setStaffError(errorData.error || 'Failed to create staff');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      setStaffError('Failed to create staff');
    }
  };
  
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !user || !editingStaff) return;
    
    setStaffError(null);
    try {
      const res = await fetch(`${apiUrl}/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          first_name: staffForm.first_name,
          last_name: staffForm.last_name,
          phone: staffForm.phone,
          email: staffForm.email,
        }),
      });
      
      if (res.ok) {
        await fetchStaff(shop.id);
        setEditingStaff(null);
        setStaffForm({ first_name: '', last_name: '', phone: '', email: '' });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update staff' }));
        setStaffError(errorData.error || 'Failed to update staff');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setStaffError('Failed to update staff');
    }
  };
  
  const handleDeleteStaff = async (staffId: string) => {
    if (!shop || !user || !confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const res = await fetch(`${apiUrl}/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (res.ok) {
        await fetchStaff(shop.id);
      } else {
        alert('Failed to delete staff');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff');
    }
  };
  
  const startEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setStaffForm({
      first_name: staffMember.first_name,
      last_name: staffMember.last_name || '',
      phone: staffMember.phone || '',
      email: staffMember.email || '',
    });
  };

  // Booking status handlers
  const openStatusUpdateModal = (bookingId: string, newStatus: 'confirmed' | 'rejected', customerName: string | null) => {
    setStatusUpdateModal({
      isOpen: true,
      bookingId,
      newStatus,
      bookingCustomerName: customerName,
    });
    setStatusUpdateMessage(null);
  };

  const closeStatusUpdateModal = () => {
    setStatusUpdateModal({
      isOpen: false,
      bookingId: null,
      newStatus: null,
      bookingCustomerName: null,
    });
    setStatusUpdateMessage(null);
  };

  const handleUpdateBookingStatus = async () => {
    if (!shop || !user || !statusUpdateModal.bookingId || !statusUpdateModal.newStatus) return;

    setStatusUpdateLoading(true);
    setStatusUpdateMessage(null);

    try {
      const res = await fetch(`${apiUrl}/bookings/${statusUpdateModal.bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          status: statusUpdateModal.newStatus,
        }),
      });

      if (res.ok) {
        setStatusUpdateMessage({
          type: 'success',
          text: statusUpdateModal.newStatus === 'confirmed' ? t('myShop.bookingConfirmed') : t('myShop.bookingRejected'),
        });
        
        // Refresh bookings list
        await fetchBookings(shop.id);
        
        // Close modal after a short delay
        setTimeout(() => {
          closeStatusUpdateModal();
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({ error: t('myShop.failedToUpdateStatus') }));
        setStatusUpdateMessage({
          type: 'error',
          text: errorData.error || t('myShop.failedToUpdateStatus'),
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setStatusUpdateMessage({
        type: 'error',
        text: t('myShop.failedToUpdateStatus'),
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Cancel booking handlers
  const openCancelModal = (bookingId: string, customerName: string | null) => {
    setCancelModal({
      isOpen: true,
      bookingId,
      bookingCustomerName: customerName,
    });
    setCancelMessage(null);
  };

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      bookingId: null,
      bookingCustomerName: null,
    });
    setCancelMessage(null);
  };

  const handleCancelBooking = async () => {
    if (!shop || !user || !cancelModal.bookingId) return;

    setCancelLoading(true);
    setCancelMessage(null);

    try {
      const res = await fetch(`${apiUrl}/bookings/${cancelModal.bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        setCancelMessage({
          type: 'success',
          text: t('booking.cancelled'),
        });
        
        // Refresh bookings list
        await fetchBookings(shop.id);
        
        // Close modal after a short delay
        setTimeout(() => {
          closeCancelModal();
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({ error: t('booking.failedToCancel') }));
        setCancelMessage({
          type: 'error',
          text: errorData.error || t('booking.failedToCancel'),
        });
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setCancelMessage({
        type: 'error',
        text: t('booking.failedToCancel'),
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // Reschedule booking handlers
  const openRescheduleModal = (bookingId: string, customerName: string | null, currentStartTime: string) => {
    const currentDate = new Date(currentStartTime);
    const localDateTime = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    
    setRescheduleModal({
      isOpen: true,
      bookingId,
      bookingCustomerName: customerName,
      currentDateTime: currentStartTime,
    });
    setNewDateTime(localDateTime);
    setRescheduleMessage(null);
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({
      isOpen: false,
      bookingId: null,
      bookingCustomerName: null,
      currentDateTime: null,
    });
    setNewDateTime('');
    setRescheduleMessage(null);
  };

  const handleRescheduleBooking = async () => {
    if (!shop || !user || !rescheduleModal.bookingId || !newDateTime) return;

    setRescheduleLoading(true);
    setRescheduleMessage(null);

    try {
      // Convert local datetime to ISO string
      const dateTimeISO = new Date(newDateTime).toISOString();

      const res = await fetch(`${apiUrl}/bookings/${rescheduleModal.bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          date_time: dateTimeISO,
        }),
      });

      if (res.ok) {
        setRescheduleMessage({
          type: 'success',
          text: t('booking.rescheduled'),
        });
        
        // Refresh bookings list
        await fetchBookings(shop.id);
        
        // Close modal after a short delay
        setTimeout(() => {
          closeRescheduleModal();
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({ error: t('booking.failedToReschedule') }));
        setRescheduleMessage({
          type: 'error',
          text: errorData.error || t('booking.failedToReschedule'),
        });
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      setRescheduleMessage({
        type: 'error',
        text: t('booking.failedToReschedule'),
      });
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch(`${apiUrl}/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(shopForm),
      });

      if (res.ok) {
        const newShop = await res.json();
        setShop(newShop);
        setShopForm(newShop);
        setShowCreateShop(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to create shop'}`);
      }
    } catch (error) {
      console.error('Error creating shop:', error);
      alert('Failed to create shop');
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !user) return;

    try {
      // Send all fields that exist in the database schema
      const updateData: Record<string, any> = {};
      if (shopForm.name !== undefined && shopForm.name !== null) updateData.name = shopForm.name;
      if (shopForm.address !== undefined && shopForm.address !== null) updateData.address = shopForm.address;
      if (shopForm.phone !== undefined && shopForm.phone !== null) updateData.phone = shopForm.phone;
      if (shopForm.email !== undefined && shopForm.email !== null) updateData.email = shopForm.email;
      if (shopForm.website !== undefined && shopForm.website !== null) updateData.website = shopForm.website;
      if (shopForm.google_place_id !== undefined && shopForm.google_place_id !== null) updateData.google_place_id = shopForm.google_place_id;
      if (shopForm.city !== undefined && shopForm.city !== null) updateData.city = shopForm.city;
      if (shopForm.country !== undefined && shopForm.country !== null) updateData.country = shopForm.country;
      if (shopForm.zip_code !== undefined && shopForm.zip_code !== null) updateData.zip_code = shopForm.zip_code;
      if (shopForm.description !== undefined && shopForm.description !== null) updateData.description = shopForm.description;
      if (shopForm.language_code !== undefined && shopForm.language_code !== null) updateData.language_code = shopForm.language_code;

      const res = await fetch(`${apiUrl}/shops/${shop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updatedShop = await res.json();
        setShop(updatedShop);
        setShopForm(updatedShop);
        setEditingShop(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to update shop'}`);
      }
    } catch (error) {
      console.error('Error updating shop:', error);
      alert('Failed to update shop');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => {
    if (!shop || !user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('shopId', shop.id);
      formData.append('type', type);

      // Ensure API URL is set correctly
      const uploadUrl = `${apiUrl}/photos/upload`;
      
      // Upload to API using multipart/form-data
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          // Don't set Content-Type - browser will set it with boundary
        },
        body: formData,
      });

      // Validate response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await res.text();
        console.error('Non-JSON response:', errorText);
        throw new Error(`Server returned non-JSON response: ${res.status} ${res.statusText}`);
      }

      if (res.ok) {
        const data = await res.json();
        const photoUrl = data.url;
        const photoRecord = data.photo;
        
        if (!photoUrl) {
          throw new Error('No URL returned from upload');
        }
        
        // Show success toast
        setPhotoToast({ type: 'success', message: t('myShop.photoUploaded') });
        setTimeout(() => setPhotoToast(null), 3000);
        
        // Immediately add the new photo to the photos state (optimistic update)
        if (photoRecord) {
          setPhotos(prev => {
            // Remove any existing photo of the same type (for logo/cover) or add to gallery
            if (type === 'logo' || type === 'cover') {
              return prev.filter(p => !(p.type === type && p.shop_id === shop.id)).concat([photoRecord]);
            } else {
              // For gallery, just add the new photo immediately
              return [...prev, photoRecord];
            }
          });
        } else {
          // Fallback: refresh photos list if no record returned
          await fetchPhotos(shop.id);
        }
        
        // Update shop with new URL (for logo/cover backward compatibility)
        if (type === 'logo' || type === 'cover') {
          const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
          const updateRes = await fetch(`${apiUrl}/shops/${shop.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
            body: JSON.stringify({
              [updateField]: photoUrl,
            }),
          });

          if (updateRes.ok) {
            const updatedShop = await updateRes.json();
            setShop(updatedShop);
          }
          // Only refresh for logo/cover to update shop data
          router.refresh();
        }
        // Gallery photos don't need router.refresh() since we update state directly
      } else {
        const errorText = await res.text();
        let errorMessage = t('myShop.failedToUpload');
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        setPhotoToast({ type: 'error', message: errorMessage });
        setTimeout(() => setPhotoToast(null), 5000);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknown');
      setPhotoToast({ type: 'error', message: `${t('myShop.failedToUpload')}: ${errorMessage}` });
      setTimeout(() => setPhotoToast(null), 5000);
    }
    
    // Reset the input
    e.target.value = '';
  };

  const handleSavePhotos = async () => {
    if (!shop || !user) return;
    
    try {
      // Refresh photos list to ensure we have the latest data
      await fetchPhotos(shop.id);
      setPhotoToast({ type: 'success', message: t('myShop.photoUploaded') });
      setTimeout(() => setPhotoToast(null), 3000);
      router.refresh();
    } catch (error) {
      console.error('Error saving photos:', error);
      setPhotoToast({ type: 'error', message: 'Failed to save photos' });
      setTimeout(() => setPhotoToast(null), 5000);
    }
  };

  const handlePhotoDelete = async (photoId: string, type: 'logo' | 'cover' | 'gallery') => {
    if (!shop || !user) return;
    if (!confirm(`Are you sure you want to delete this ${type} photo?`)) return;

    try {
      const res = await fetch(`${apiUrl}/shops/${shop.id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        // Remove photo from state immediately
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        
        // Refresh photos list to ensure consistency
        await fetchPhotos(shop.id);
        
        // Update shop if it was logo or cover
        if (type === 'logo' || type === 'cover') {
          const updateField = type === 'logo' ? 'logo_url' : 'cover_photo_url';
          const updateRes = await fetch(`${apiUrl}/shops/${shop.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
            body: JSON.stringify({
              [updateField]: null,
            }),
          });

          if (updateRes.ok) {
            const updatedShop = await updateRes.json();
            setShop(updatedShop);
          }
        }
        
        router.refresh();
      } else {
        const error = await res.json();
        alert(`${t('common.error')}: ${error.error || t('myShop.failedToDelete')}`);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(t('myShop.failedToDelete'));
    }
  };

  if (pageLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // User doesn't own a shop - show create/claim options
  if (!shop) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('myShop.title')}</h1>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('myShop.getStarted')}</h2>
          <p className="text-gray-600 mb-6">
            {t('myShop.noShop')} {t('myShop.createShop')} {t('common.or')} {t('myShop.claimShop')}.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Shop */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('myShop.createNewShop')}</h3>
              <p className="text-gray-600 mb-4">{t('myShop.startFresh')}</p>
              <button
                onClick={() => setShowCreateShop(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('myShop.createShop')}
              </button>
            </div>

            {/* Claim Shop */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('myShop.claimExistingShop')}</h3>
              <p className="text-gray-600 mb-4">{t('myShop.claimOwnership')}</p>
              <button
                onClick={() => setShowClaimShop(true)}
                className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t('myShop.claimShop')}
              </button>
            </div>
          </div>
        </div>

        {/* Create Shop Form */}
        {showCreateShop && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('myShop.createNewShop')}</h2>
            <form onSubmit={handleCreateShop}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.shopName')}</label>
                  <input
                    type="text"
                    required
                    value={shopForm.name || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.address')}</label>
                  <input
                    type="text"
                    required
                    value={shopForm.address || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.phone')}</label>
                  <input
                    type="tel"
                    required
                    value={shopForm.phone || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.email')}</label>
                  <input
                    type="email"
                    required
                    value={shopForm.email || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('myShop.createShop')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateShop(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Claim Shop Form */}
        {showClaimShop && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('myShop.claimShop')}</h2>
              <button
                onClick={() => setShowClaimShop(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {t('myShop.selectUnclaimedShop')}
            </p>
            
            {claimLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">{t('shops.loading')}</p>
              </div>
            ) : unclaimedShops.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('myShop.noUnclaimedShops')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {unclaimedShops.map((unclaimedShop) => (
                  <div
                    key={unclaimedShop.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{unclaimedShop.name}</h3>
                        {unclaimedShop.address && (
                          <p className="text-sm text-gray-600 mt-1">{unclaimedShop.address}</p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          try {
                            setClaimLoading(true);
                            const res = await fetch(`${apiUrl}/shops/${unclaimedShop.id}/claim`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-user-id': user.id,
                              },
                            });
                            
                            if (res.ok) {
                              const claimedShop = await res.json();
                              setShop(claimedShop);
                              setShopForm(claimedShop);
                              setShowClaimShop(false);
                              router.refresh();
                            } else {
                              const error = await res.json();
                              alert(`Error: ${error.error || 'Failed to claim shop'}`);
                            }
                          } catch (error) {
                            console.error('Error claiming shop:', error);
                            alert('Failed to claim shop');
                          } finally {
                            setClaimLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('myShop.claimShop')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // User owns a shop - show management UI
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Section Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('myShop.title')}</h1>
        <p className="text-lg text-gray-600">{shop.name}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1">
          {(['overview', 'services', 'bookings', 'photos', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                // Fetch data when tab is clicked
                if (shop && user) {
                  if (tab === 'services') {
                    fetchServices(shop.id);
                  } else if (tab === 'bookings') {
                    fetchBookings(shop.id);
                  } else if (tab === 'photos') {
                    fetchPhotos(shop.id);
                  } else if (tab === 'reviews') {
                    fetchReviews(shop.id);
                  }
                }
              }}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-blue-600 font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t(`myShop.${tab}`)}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('myShop.shopOverview')}</h2>
            {!editingShop && (
              <button
                onClick={() => setEditingShop(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('myShop.editShop')}
              </button>
            )}
          </div>

          {editingShop ? (
            <form onSubmit={handleUpdateShop}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.shopName')}</label>
                  <input
                    type="text"
                    required
                    value={shopForm.name || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.address')}</label>
                  <input
                    type="text"
                    required
                    value={shopForm.address || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.phone')}</label>
                    <input
                      type="tel"
                      required
                      value={shopForm.phone || ''}
                      onChange={(e) => setShopForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.email')}</label>
                    <input
                      type="email"
                      required
                      value={shopForm.email || ''}
                      onChange={(e) => setShopForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.website')}</label>
                  <input
                    type="url"
                    value={shopForm.website || ''}
                    onChange={(e) => setShopForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShop(false);
                      setShopForm(shop ? {
                        name: shop.name || '',
                        address: shop.address || '',
                        phone: shop.phone || '',
                        email: shop.email || '',
                        website: shop.website || '',
                        google_place_id: shop.google_place_id || '',
                        city: shop.city || '',
                        country: shop.country || '',
                        zip_code: shop.zip_code || '',
                        description: shop.description || '',
                        language_code: shop.language_code || '',
                        category: shop.category || null,
                        subcategory: shop.subcategory || null,
                        logo_url: shop.logo_url || null,
                        cover_photo_url: shop.cover_photo_url || null,
                      } : {
                        name: '',
                        address: '',
                        phone: '',
                        email: '',
                        website: '',
                        google_place_id: '',
                        city: '',
                        country: '',
                        zip_code: '',
                        description: '',
                        language_code: '',
                      });
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{t('common.name')}</dt>
                  <dd className="text-lg text-gray-900">{shop.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{t('myShop.address')}</dt>
                  <dd className="text-lg text-gray-900">{shop.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{t('myShop.phone')}</dt>
                  <dd className="text-lg text-gray-900">{shop.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{t('myShop.email')}</dt>
                  <dd className="text-lg text-gray-900">{shop.email}</dd>
                </div>
              </div>
              {shop.website && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{t('myShop.website')}</dt>
                  <dd>
                    <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-lg text-blue-600 hover:underline">
                      {shop.website}
                    </a>
                  </dd>
                </div>
              )}
            </div>
          )}

          {/* LINE QR Code Section */}
          {shop && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">LINE QR Code</h3>
              <LineQrSection shopId={shop.id} shop={shop} user={user} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('myShop.services')}</h2>
          
          {/* Create/Edit Service Form */}
          <div className="mb-6 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingService ? t('myShop.editService') : t('myShop.createNewService')}
            </h3>
            {serviceError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {serviceError}
              </div>
            )}
            <form onSubmit={editingService ? handleUpdateService : handleCreateService} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.serviceName')} *</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('myShop.serviceName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.servicePrice')} *</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.serviceDescription')}</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('myShop.serviceDescription')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('myShop.serviceDuration')} *</label>
                <input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingService ? t('common.update') : t('common.create')}
                </button>
                {editingService && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({ name: '', description: '', price: 0, duration_minutes: 0 });
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Services List */}
          {services.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <p className="text-gray-600 mb-2">{t('myShop.noServices')}</p>
              <p className="text-sm text-gray-500">{t('myShop.createFirstService')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.name')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.description')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.price')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.duration')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-medium">{service.name}</td>
                      <td className="py-3 px-4 text-gray-600">{service.description || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">${service.price}</td>
                      <td className="py-3 px-4 text-gray-700">{service.duration_minutes || 0} min</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditService(service)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('myShop.bookings')}</h2>
          {bookings.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-600 mb-2">{t('myShop.noBookings')}</p>
              <p className="text-sm text-gray-500">{t('myShop.bookingsWillAppear')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('myShop.customer')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.email')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.phone')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('myShop.dateTime')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('myShop.service')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.status')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {booking.customer_name || t('common.unknown')}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{booking.customer_email || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{booking.customer_phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {booking.start_time ? new Date(booking.start_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {(booking as any).services?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          booking.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {t(`status.${booking.status || 'pending'}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 flex-wrap">
                          {(!booking.status || booking.status === 'pending') && (
                            <>
                              <button
                                onClick={() => openStatusUpdateModal(booking.id, 'confirmed', booking.customer_name || null)}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                              >
                                {t('common.confirm')}
                              </button>
                              <button
                                onClick={() => openStatusUpdateModal(booking.id, 'rejected', booking.customer_name || null)}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                              >
                                {t('common.reject')}
                              </button>
                            </>
                          )}
                          {booking.status && booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => openCancelModal(booking.id, booking.customer_name || null)}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                              >
                                {t('booking.cancelBooking')}
                              </button>
                              <button
                                onClick={() => openRescheduleModal(booking.id, booking.customer_name || null, booking.start_time)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                {t('booking.rescheduleBooking')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('reviews.title')}</h2>
          {loadingReviews ? (
            <p className="text-gray-500">{t('common.loading')}</p>
          ) : (
            <>
              {reviewStats && (
                <div className="mb-6">
                  <ReviewStats
                    averageRating={reviewStats.averageRating}
                    totalReviews={reviewStats.totalReviews}
                    ratingDistribution={reviewStats.ratingDistribution}
                  />
                </div>
              )}
              {reviews.length === 0 ? (
                <p className="text-gray-500">{t('reviews.noReviews')}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <ReviewCard review={review} />
                      {!review.owner_response && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <textarea
                            value={ownerResponse[review.id] || ''}
                            onChange={(e) =>
                              setOwnerResponse((prev) => ({
                                ...prev,
                                [review.id]: e.target.value,
                              }))
                            }
                            placeholder={t('reviews.respond')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                            rows={3}
                          />
                          <button
                            onClick={() => handleOwnerResponse(review.id, ownerResponse[review.id] || '')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            {t('reviews.respond')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{t('myShop.photos')}</h2>
            <button
              onClick={handleSavePhotos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('common.save')}
            </button>
          </div>
          
          {/* Toast Notification */}
          {photoToast && (
            <div className={`mb-4 p-3 rounded-lg ${
              photoToast.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {photoToast.message}
            </div>
          )}
          
          {/* Logo Upload */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('myShop.shopLogo')}</h3>
            <div className="flex items-center gap-4">
              {(() => {
                const logoPhoto = photos.find(p => p.type === 'logo');
                const logoUrl = logoPhoto?.url || shop.logo_url;
                return logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                    {t('myShop.noLogo')}
                  </div>
                );
              })()}
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handlePhotoUpload(e, 'logo')}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                {photos.find(p => p.type === 'logo') || shop.logo_url ? t('myShop.changeLogo') : t('myShop.uploadLogo')}
              </label>
              {(() => {
                const logoPhoto = photos.find(p => p.type === 'logo');
                if (logoPhoto) {
                  return (
                    <button
                      onClick={() => handlePhotoDelete(logoPhoto.id, 'logo')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {t('common.delete')}
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Cover Photo Upload */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('myShop.coverPhoto')}</h3>
            <div className="flex items-center gap-4">
              {(() => {
                const coverPhoto = photos.find(p => p.type === 'cover');
                const coverUrl = coverPhoto?.url || shop.cover_photo_url;
                return coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-48 h-32 object-cover rounded-lg border border-gray-200" />
                ) : (
                  <div className="w-48 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                    {t('myShop.noCoverPhoto')}
                  </div>
                );
              })()}
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handlePhotoUpload(e, 'cover')}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                {photos.find(p => p.type === 'cover') || shop.cover_photo_url ? t('myShop.changeCover') : t('myShop.uploadCover')}
              </label>
              {(() => {
                const coverPhoto = photos.find(p => p.type === 'cover');
                if (coverPhoto) {
                  return (
                    <button
                      onClick={() => handlePhotoDelete(coverPhoto.id, 'cover')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {t('common.delete')}
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Gallery Photos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('myShop.galleryPhotos')}</h3>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => handlePhotoUpload(e, 'gallery')}
              className="hidden"
              id="gallery-upload"
            />
            <label
              htmlFor="gallery-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors mb-4"
            >
              {t('myShop.uploadGalleryPhoto')}
            </label>
            {photos.filter(p => p.type === 'gallery').length === 0 ? (
              <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <div className="text-2xl mb-2">📸</div>
                <p className="text-sm text-gray-500">{t('myShop.noGalleryPhotos')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.filter(p => p.type === 'gallery').map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={photo.url} 
                      alt="Gallery" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        console.error('Error loading image:', photo.url);
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      onClick={() => handlePhotoDelete(photo.id, 'gallery')}
                      className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      {statusUpdateModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
          onClick={closeStatusUpdateModal}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeStatusUpdateModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative" 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeStatusUpdateModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {statusUpdateModal.newStatus === 'confirmed' ? t('myShop.confirmBooking') : t('myShop.rejectBooking')}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {statusUpdateModal.newStatus === 'confirmed' ? t('myShop.areYouSureConfirm') : t('myShop.areYouSureReject')} {statusUpdateModal.bookingCustomerName ? `${t('common.for')} ${statusUpdateModal.bookingCustomerName}` : ''}?
            </p>

            {statusUpdateMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                statusUpdateMessage.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {statusUpdateMessage.text}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeStatusUpdateModal}
                disabled={statusUpdateLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleUpdateBookingStatus}
                disabled={statusUpdateLoading}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  statusUpdateModal.newStatus === 'confirmed'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {statusUpdateLoading ? t('common.updating') : statusUpdateModal.newStatus === 'confirmed' ? t('common.confirm') : t('common.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {cancelModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
          onClick={closeCancelModal}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeCancelModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative" 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeCancelModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('booking.cancelBooking')}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {t('booking.cancelConfirm')} {cancelModal.bookingCustomerName ? `${t('common.for')} ${cancelModal.bookingCustomerName}` : ''}?
            </p>

            {cancelMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                cancelMessage.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {cancelMessage.text}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.no')}, {t('common.keepIt')}
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? t('common.cancelling') : `${t('common.yes')}, ${t('booking.cancelBooking')}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Booking Modal */}
      {rescheduleModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
          onClick={closeRescheduleModal}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeRescheduleModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative" 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeRescheduleModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('booking.rescheduleBooking')}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {rescheduleModal.bookingCustomerName ? `${t('booking.rescheduleConfirm')} ${rescheduleModal.bookingCustomerName}` : t('booking.rescheduleBooking')}:
            </p>

            {rescheduleModal.currentDateTime && (
              <p className="text-sm text-gray-500 mb-4">
                {t('booking.current')}: {new Date(rescheduleModal.currentDateTime).toLocaleString()}
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('booking.newDateTime')}
              </label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {rescheduleMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                rescheduleMessage.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {rescheduleMessage.text}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeRescheduleModal}
                disabled={rescheduleLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleRescheduleBooking}
                disabled={rescheduleLoading || !newDateTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rescheduleLoading ? t('common.rescheduling') : t('booking.rescheduleBooking')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyShopPage;

