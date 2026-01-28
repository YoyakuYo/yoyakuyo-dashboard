// apps/dashboard/app/shops/[id]/page.tsx
// Public shop detail page with booking widget and AI chat

"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { apiUrl } from '@/lib/apiClient';
import { useAuth } from '@/lib/useAuth';
// Web customer auth removed
import { getSupabaseClient } from '@/lib/supabaseClient';
import ReviewCard from '../../components/ReviewCard';
import ReviewStats from '../../components/ReviewStats';
import ReviewForm from '../../components/ReviewForm';

// Dynamically import map component to avoid SSR issues
const ShopMap = dynamic(() => import('../../components/ShopMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface Shop {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  opening_hours?: any | null;
  description?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  categories?: {
    id: string;
    name: string;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  google_place_id?: string | null;
  city?: string | null;
  country?: string | null;
  zip_code?: string | null;
}

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  is_active?: boolean;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role?: string | null;
}

interface Timeslot {
  id: string;
  start_time: string;
  end_time: string;
  staff_id?: string | null;
  service_id?: string | null;
  status?: string | null;
}

interface Message {
  id: string;
  sender_type: 'customer' | 'ai' | 'owner';
  message: string;
  created_at: string;
}

interface Photo {
  id: string;
  shop_id: string;
  type: 'logo' | 'cover' | 'gallery';
  url: string;
  created_at: string;
  updated_at: string;
}


function formatOpeningHours(openingHours: any): string {
  if (!openingHours || typeof openingHours !== 'object') {
    return 'Not specified';
  }

  // Handle Google Places format: { "monday": ["09:00", "18:00"], ... }
  if (openingHours.monday || openingHours.tuesday || openingHours.wednesday) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      const hours = openingHours[day];
      if (Array.isArray(hours) && hours.length >= 2) {
        return `${dayNames[idx]}: ${hours[0]} - ${hours[1]}`;
      }
      return `${dayNames[idx]}: Closed`;
    }).join('\n');
  }

  // Handle weekday_text format: ["Monday: 9:00 AM – 6:00 PM", ...]
  if (Array.isArray(openingHours.weekday_text)) {
    return openingHours.weekday_text.join('\n');
  }

  return JSON.stringify(openingHours);
}

export default function PublicShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params?.id as string;
  const { user } = useAuth(); // For owners (Supabase Auth)
  let locale = 'en';
  
  // Safe translation function with fallback
  let t: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
  } catch (error) {
    // Fallback if translations fail
    console.warn('Translation error, using fallback:', error);
    t = ((key: string) => {
      const fallbacks: Record<string, string> = {
        'shops.photos': 'Photos',
        'shops.photosWillAppear': 'Photos will appear here once added by the shop owner.',
        'shops.services': 'Services',
        'shops.staff': 'Staff',
        'shops.shopNotFound': 'Shop not found',
        'shops.shopDoesNotExist': 'The shop you are looking for does not exist.',
        'shops.invalidShopId': 'Invalid shop ID',
        'shops.failedToFetchShop': 'Failed to fetch shop',
        'shops.noServicesAvailable': 'No services available.',
        'shops.noStaffAvailable': 'No staff information available.',
        'booking.title': 'Book an appointment',
        'booking.bookAppointment': 'Book Appointment',
        'common.loading': 'Loading...',
      };
      return fallbacks[key] || key;
    }) as ReturnType<typeof useTranslations>;
  }
  try {
    locale = useLocale();
  } catch (error) {
    console.warn('Locale error, using fallback:', error);
  }

  const getCategoryName = (categoryName: string | null | undefined) => {
    if (!categoryName) return '';
    const key = categoryName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    try {
      const translated = t(`categories.${key}`);
      if (translated && translated !== `categories.${key}`) {
        return translated;
      }
    } catch {
      // Fall back to original name
    }
    return categoryName;
  };

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [bookingServiceId, setBookingServiceId] = useState<string>('');
  const [bookingStaffId, setBookingStaffId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerProfile, setCustomerProfile] = useState<{ name: string; email: string } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Date dropdown state
  const [availableDates, setAvailableDates] = useState<Array<{ date: string; status: 'available' | 'closed' }>>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Check for booking success from URL query parameter (for guest redirects)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const bookingSuccessParam = urlParams.get('booking');

      if (bookingSuccessParam === 'success' && !user) {
        // Set booking success state
        setBookingSuccess(true);

        // Remove query parameter from URL without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);

        // Redirect to landing page after 3 seconds
        const redirectTimer = setTimeout(() => {
          router.push('/');
        }, 3000);

        return () => clearTimeout(redirectTimer);
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (!bookingSuccess || user) {
      return;
    }
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 3000);
    return () => clearTimeout(redirectTimer);
  }, [bookingSuccess, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setCustomerName((prev) => {
      if (prev.trim()) {
        return prev;
      }
      const nameFromProfile = customerProfile?.name?.trim();
      const nameFromMetadata = typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name.trim()
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name.trim()
          : '';
      return nameFromProfile || nameFromMetadata;
    });

    setCustomerEmail((prev) => {
      if (prev.trim()) {
        return prev;
      }
      return customerProfile?.email?.trim() || user.email || '';
    });
  }, [user, customerProfile]);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!shopId) {
      setError(t('shops.invalidShopId'));
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shop details
        const shopRes = await fetch(`${apiUrl}/shops/${shopId}`);
        if (!shopRes.ok) {
          throw new Error(`${t('shops.failedToFetchShop')}: ${shopRes.status}`);
        }
        const shopData = await shopRes.json();
        setShop(shopData);

        // Fetch services (only active)
        const servicesRes = await fetch(`${apiUrl}/shops/${shopId}/services`);
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          const activeServices = Array.isArray(servicesData)
            ? servicesData.filter((s: Service) => s.is_active !== false)
            : [];
          setServices(activeServices);
        }

        // Fetch staff
        const staffRes = await fetch(`${apiUrl}/shops/${shopId}/staff`);
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(Array.isArray(staffData) ? staffData : []);
        }

        // Fetch photos (gallery photos only)
        const photosRes = await fetch(`${apiUrl}/shops/${shopId}/photos?type=gallery`);
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(Array.isArray(photosData) ? photosData : []);
        }

        // Fetch timeslots/availability (if endpoint exists)
        // For now, we'll show a message if no timeslots are available
      } catch (err) {
        console.error("Error fetching shop data:", err);
        setError(err instanceof Error ? err.message : 'Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId, apiUrl, t]);


  // Load reviews
  useEffect(() => {
    if (!shopId) return;

    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        // Fetch reviews
        const reviewsRes = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        }

        // Fetch review stats
        const statsRes = await fetch(`${apiUrl}/reviews/shop/${shopId}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setReviewStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [shopId, apiUrl]);

  const reloadReviews = async () => {
    if (!shopId) return;
    try {
      setLoadingReviews(true);
      const reviewsRes = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      }
      const statsRes = await fetch(`${apiUrl}/reviews/shop/${shopId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setReviewStats(statsData);
      }
    } catch (e) {
      console.error('Error reloading reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch available dates when shop is loaded
  useEffect(() => {
    if (shopId && services.length > 0) {
      fetchAvailableDates();
    }
  }, [shopId, services.length]);

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBookingDate(e.target.value);
    setBookingTime('');
  };


  const handleReviewSubmit = async (reviewData: any) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add x-user-id header for logged-in users (both Supabase and custom auth)
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      // Web customers removed - only owners can review

      const res = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewData),
      });

      if (res.ok) {
        setShowReviewForm(false);
        // Reload reviews
        const reviewsRes = await fetch(`${apiUrl}/reviews?shop_id=${shopId}&limit=10`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        }
        const statsRes = await fetch(`${apiUrl}/reviews/shop/${shopId}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setReviewStats(statsData);
        }
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  };

  const fetchAvailableDates = async () => {
    if (!shopId) return;

    setLoadingDates(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ahead

      const response = await fetch(`${apiUrl}/shops/${shopId}/availability/dates?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const dates = await response.json();
        setAvailableDates(dates);
      } else {
        console.error('Failed to fetch available dates');
        setAvailableDates([]);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopId || !bookingServiceId) {
      setBookingError(t('booking.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    if (!bookingDate) {
      setBookingError(t('booking.selectDateFirst') || 'Please select a date from the dropdown above first.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(false);

    if (!customerName.trim()) {
      setBookingError(t('booking.enterName') || 'Please enter your name');
      return;
    }
    if (!customerEmail.trim()) {
      setBookingError(t('booking.enterEmail') || 'Please enter your email');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setBookingError(t('booking.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    try {
      // Calculate start_time and end_time from bookingDate and bookingTime
      const startDateTime = new Date(`${bookingDate}T${bookingTime}`);
      const service = services.find(s => s.id === bookingServiceId);
      const durationMinutes = service?.duration_minutes || 30;
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const res = await fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
          ...(user?.id && { 'x-user-id': user.id }), // Send user ID if logged in
        },
        body: JSON.stringify({
          shop_id: shopId,
          service_id: bookingServiceId,
          staff_id: bookingStaffId || null,
          customer_name: customerName || customerProfile?.name || user?.email?.split('@')[0] || 'Guest',
          customer_email: customerEmail || user?.email || null,
          date: bookingDate,
          time_slot: bookingTime,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'pending',
        }),
      });

      if (res.ok) {
        setBookingSuccess(true);
        // Reset form
        setBookingServiceId('');
        setBookingStaffId('');
        setBookingDate('');
        setBookingTime('');
      } else {
        const errorData = await res.json();
        setBookingError(errorData.error || t('booking.failedToCreate'));
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError(t('booking.failedToCreate'));
    } finally {
      setBookingLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('shops.shopNotFound')}</h2>
        <p className="text-gray-600">{error || t('shops.shopDoesNotExist')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shop Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
            {shop.categories && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded mb-4">
                {getCategoryName(shop.categories.name)}
              </span>
            )}
            <div className="space-y-2 text-gray-700">
              <p><strong>{t('myShop.address')}:</strong> {shop.address}</p>
              {shop.phone && <p><strong>{t('myShop.phone')}:</strong> {shop.phone}</p>}
              {shop.email && <p><strong>{t('myShop.email')}:</strong> {shop.email}</p>}
              {shop.website && (
                <p>
                  <strong>{t('common.website')}:</strong>{' '}
                  <a 
                    href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {shop.website}
                  </a>
                </p>
              )}
              {shop.opening_hours && (
                <div className="mt-2">
                  <strong>{t('shops.openingHours')}:</strong>
                  <div className="mt-1 text-sm whitespace-pre-line">
                    {formatOpeningHours(shop.opening_hours)}
                  </div>
                </div>
              )}
            </div>
            {shop.description && (
              <div className="mt-4">
                <p className="text-gray-600">{shop.description}</p>
              </div>
            )}
          </div>

          {/* Map */}
          {shop.latitude && shop.longitude && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('shops.location')}</h2>
              <ShopMap
                latitude={shop.latitude}
                longitude={shop.longitude}
                shopName={shop.name}
                address={shop.address}
                height="400px"
              />
            </div>
          )}

          {/* Photo Gallery */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('shops.photos')}</h2>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative w-full pb-[100%] overflow-hidden rounded-lg bg-gray-100 group cursor-pointer">
                    <img
                      src={photo.url}
                      alt={`${shop.name} gallery photo`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Error loading image:', photo.url);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t('shops.photosWillAppear')}
              </p>
            )}
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('shops.services')}</h2>
            {services.length === 0 ? (
              <p className="text-gray-500">{t('shops.noServicesAvailable')}</p>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">¥{service.price.toLocaleString()}</p>
                        {service.duration_minutes && (
                          <p className="text-sm text-gray-500">{service.duration_minutes} min</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('shops.staff')}</h2>
            {staff.length === 0 ? (
              <p className="text-gray-500">{t('shops.noStaffAvailable')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {staff.map((member) => (
                  <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.role && (
                      <p className="text-sm text-gray-600 mt-1">{member.role}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('reviews.title')}</h2>
            
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

                {showReviewForm ? (
                  <div className="mb-6">
                    <ReviewForm
                      shopId={shopId}
                      customerId={user?.id || null} // Pass customer ID for authenticated users
                      isGuest={!user} // Only show guest name field if not logged in
                      onSubmit={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('reviews.writeReview')}
                  </button>
                )}

                {reviews.length === 0 ? (
                  <p className="text-gray-500">{t('reviews.noReviews')}</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        currentUserId={user?.id || null}
                        onChanged={reloadReviews}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Date Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('booking.selectDate') || 'Select Date & Book'}</h3>
          <div className="space-y-4">
            <select
              value={bookingDate}
              onChange={handleDateChange}
              disabled={loadingDates || availableDates.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">
                {loadingDates
                  ? (t('booking.loadingDates') || 'Loading dates...')
                  : availableDates.length === 0
                    ? (t('booking.noDatesAvailable') || 'No dates available')
                    : (t('booking.chooseDate') || 'Choose a date')}
              </option>
              {availableDates.map((dateOption) => (
                <option
                  key={dateOption.date}
                  value={dateOption.date}
                  disabled={dateOption.status === 'closed'}
                >
                  {new Date(dateOption.date).toLocaleDateString(locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {dateOption.status === 'closed' ? ' - CLOSED' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>


        {/* Booking Widget (Inline Form - Alternative) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('booking.title')}</h2>
            {user && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Booking as: </span>
                <span className="text-gray-900">{customerName || customerEmail || user.email}</span>
              </div>
            )}
          </div>
          {bookingSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-700 font-medium">{t('booking.success')}</p>
              <p className="text-green-600 text-sm mt-1">{t('booking.ownerWillConfirm')}</p>
              {!user && (
                <p className="text-green-600 text-xs mt-2 italic">
                  Redirecting to home page in a few seconds...
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('booking.yourName') || 'Your Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder={t('booking.yourName') || 'Enter your name'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.email') || 'Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  placeholder={t('booking.yourEmail') || 'Enter your email'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('booking.service')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={bookingServiceId}
                  onChange={(e) => setBookingServiceId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">{t('booking.selectService')}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ¥{service.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {staff.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking.staffOptional')}
                  </label>
                  <select
                    value={bookingStaffId}
                    onChange={(e) => setBookingStaffId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('booking.anyAvailable')}</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {bookingDate ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {t('booking.selectedDate') || 'Selected Date'}:
                      </p>
                      <p className="text-blue-700 font-semibold">
                        {new Date(bookingDate).toLocaleDateString(locale, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingDate('')}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      {t('common.change') || 'Change'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    {t('booking.selectDateFirst') || 'Please select a date from the dropdown above first.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('booking.time')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{bookingError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={bookingLoading || !bookingDate}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bookingLoading ? t('common.submitting') : t('booking.submit')}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>

    </div>
  );
}

