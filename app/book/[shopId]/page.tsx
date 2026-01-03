// apps/dashboard/app/book/[shopId]/page.tsx

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import { useAuth } from '@/lib/useAuth';
import { useCustomAuth } from '@/lib/useCustomAuth';

interface Service {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

interface Timeslot {
  id: string;
  start_time: string;
  end_time: string;
}

interface ChatMessage {
  id: string;
  senderType: 'customer' | 'owner' | 'ai';
  content: string;
  createdAt: string;
  readByOwner: boolean;
  readByCustomer: boolean;
}

export default function PublicBookingPage() {
  const params = useParams();
  const shopId = params?.shopId as string;
  const t = useTranslations();
  const { user: supabaseUser, loading: authLoading } = useAuth();
  const { user: customUser } = useCustomAuth();
  // Use custom auth user if available, otherwise fall back to Supabase auth
  const user = customUser || supabaseUser;
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customerProfile, setCustomerProfile] = useState<{ name: string; email: string } | null>(null);
  const [shopName, setShopName] = useState<string>('');
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  
  // Anonymous session ID for public visitors
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [guestId, setGuestIdState] = useState<string | null>(null);

  // Helper functions for guest ID management
  const getOrCreateGuestId = (): string => {
    if (typeof window === 'undefined') return '';
    let gid = localStorage.getItem('yoyaku_yo_guest_id');
    if (!gid) {
      gid = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('yoyaku_yo_guest_id', gid);
    }
    return gid;
  };

  const setGuestId = (id: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yoyaku_yo_guest_id', id);
    }
    setGuestIdState(id);
  };
  
  // LINE QR code state
  const [lineQrUrl, setLineQrUrl] = useState<string | null>(null);
  const [lineDeeplinkUrl, setLineDeeplinkUrl] = useState<string | null>(null);


  // Initialize anonymous session ID on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('yoyaku_yo_anonymous_session');
      if (!sessionId) {
        sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('yoyaku_yo_anonymous_session', sessionId);
      }
      setAnonymousSessionId(sessionId);

      // Guest UUID for persistence across bookings + messaging
      const gid = getOrCreateGuestId();
      setGuestIdState(gid);
    }
  }, []);

  // Load customer profile if user is logged in
  useEffect(() => {
    const userId = user?.id || (user as any)?.id;
    const userEmail = user?.email || (user as any)?.email;
    const userName = (user as any)?.name || user?.user_metadata?.name;
    
    if (userId || userEmail) {
      const loadCustomerProfile = async () => {
        // If using custom auth, use the user data directly
        if (customUser && !supabaseUser) {
          const profileName = userName || userEmail?.split('@')[0] || '';
          const profileEmail = userEmail || '';
          setCustomerProfile({ name: profileName, email: profileEmail });
          setName(profileName);
          setEmail(profileEmail);
          return;
        }

        // For Supabase auth, fetch from database
        if (userId && supabaseUser) {
          const supabase = getSupabaseClient();
          
          // First try to get from users table (for WEB customers)
          const { data: userData } = await supabase
            .from("users")
            .select("full_name, email")
            .eq("id", userId)
            .maybeSingle();

          if (userData) {
            const profileName = userData.full_name || user.user_metadata?.name || userEmail?.split('@')[0] || '';
            const profileEmail = userData.email || userEmail || '';
            setCustomerProfile({ name: profileName, email: profileEmail });
            setName(profileName);
            setEmail(profileEmail);
            return;
          }

          // Fallback: try customer_profiles (for LINE customers)
          const { data: profile } = await supabase
            .from("customer_profiles")
            .select("name, email, full_name, line_display_name")
            .eq("customer_auth_id", userId)
            .maybeSingle();

          if (profile) {
            const profileName = profile.line_display_name || profile.full_name || profile.name || user.user_metadata?.name || userEmail?.split('@')[0] || '';
            const profileEmail = profile.email || userEmail || '';
            setCustomerProfile({ name: profileName, email: profileEmail });
            setName(profileName);
            setEmail(profileEmail);
          } else {
            // Final fallback to user metadata
            const finalUserName = userName || user.user_metadata?.full_name || userEmail?.split('@')[0] || '';
            const finalUserEmail = userEmail || '';
            setCustomerProfile({ name: finalUserName, email: finalUserEmail });
            setName(finalUserName);
            setEmail(finalUserEmail);
          }
        }
      };
      loadCustomerProfile();
    } else {
      // Clear customer profile when user logs out
      setCustomerProfile(null);
      setName('');
      setEmail('');
    }
  }, [user, customUser, supabaseUser]);

  // LINE QR code feature removed - staff features were removed
  // Keeping state for potential future implementation

  useEffect(() => {
    const fetchShopInfo = async () => {
        try {
        const res = await fetch(`${apiUrl}/shops/${shopId}`);
          if (res.ok) {
            const data = await res.json();
          setShopName(data.name || '');
          }
        } catch (error) {
          // Silently handle errors
      }
    };

    const fetchServices = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}/services`);
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch services:", res.status, res.statusText);
          setServices([]);
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error("Error fetching services:", error);
        }
        setServices([]);
      }
    };

    fetchShopInfo();
    fetchServices();
  }, [shopId, apiUrl]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const fetchAvailability = async () => {
    if (!selectedDate) {
      alert(t('booking.selectDate') || 'Please select a date first');
      return;
    }

    setLoadingAvailability(true);
    setSelectedTimeslot(null);
    setTimeslots([]);
    setAvailabilityChecked(false);

    try {
      const url = `${apiUrl}/shops/${shopId}/availability?date=${selectedDate}`;

      const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
        const availableSlots = Array.isArray(data) ? data : [];
        setTimeslots(availableSlots);
        setAvailabilityChecked(true);
        if (availableSlots.length === 0) {
          alert(t('booking.noAvailability') || 'No available timeslots for this date');
        }
        } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch availability' }));
        alert(errorData.error || t('booking.availabilityError') || 'Failed to check availability');
          setTimeslots([]);
        setAvailabilityChecked(true);
        }
      } catch (error: any) {
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error("Error fetching availability:", error);
        alert(t('booking.availabilityError') || 'Failed to check availability');
        }
        setTimeslots([]);
      setAvailabilityChecked(true);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const bookAppointment = async () => {
    // For authenticated users, name/email are not required (come from account)
    // For guests, name is required
    const isAuthenticated = user && !authLoading;
    const requiresName = !isAuthenticated;

    if (selectedService && selectedStaff && selectedDate && (!requiresName || name)) {
      const bookingData: any = {
        shop_id: shopId,
        service_id: selectedService,
        staff_id: selectedStaff,
        start_time: selectedDate,
        end_time: selectedDate,
      };

      // Only include name/email for guest users
      if (!isAuthenticated) {
      const nameParts = name.trim().split(/\s+/);
        bookingData.first_name = nameParts[0] || name;
        bookingData.last_name = nameParts.slice(1).join(' ') || null;
        bookingData.email = email;
        bookingData.notes = `Booking for ${name}`;
      }

      try {
        const res = await fetch(`${apiUrl}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });

        if (res.ok) {
          const data = await res.json();
          alert(t('booking.bookingSuccessful'));
        } else {
          const errorData = await res.json().catch(() => ({ error: t('common.unknown') }));
          alert(`${t('booking.bookingFailed')}: ${errorData.error || t('common.tryAgain')}`);
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error('Error creating booking:', error);
          alert(t('booking.bookingFailed'));
        }
  };
    } else {
      // For logged-in users, use customer profile data (handle possible null user safely)
      const finalName =
        customerProfile?.name ||
        name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'Customer';
      const finalEmail = customerProfile?.email || email || user?.email || '';
      setName(finalName);
      setEmail(finalEmail);
    }

    setBookingLoading(true);

    // Calculate start_time and end_time from date and selected timeslot
    let startDateTime: Date;
    let endDateTime: Date;
    
    const timeslotToUse = selectedTimeslot || (timeslots.length > 0 ? timeslots[0] : null);
    
    if (timeslotToUse && selectedDate) {
      startDateTime = new Date(`${selectedDate}T${timeslotToUse.start_time}`);
      endDateTime = new Date(`${selectedDate}T${timeslotToUse.end_time}`);
    } else {
      alert(t('booking.selectTimeslot') || 'Please select a timeslot');
      setBookingLoading(false);
      return;
    }

    try {
      // For authenticated users, don't send name/email - API will fetch from database
      // For guest users, send name/email from form
      const isAuthenticated = user && (user.id || (user as any).email) && !authLoading;
      
      const bookingPayload: any = {
        shop_id: shopId,
        service_id: selectedService,
        date: selectedDate,
        time_slot: `${timeslotToUse.start_time}-${timeslotToUse.end_time}`,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      };

      // Only include name/email for guest users
      if (!isAuthenticated) {
        if (!name.trim()) {
          alert(t('booking.enterName') || 'Please enter your name');
          setBookingLoading(false);
          return;
        }
        if (!email.trim()) {
          alert(t('booking.enterEmail') || 'Please enter your email');
          setBookingLoading(false);
          return;
        }
        bookingPayload.customer_name = name.trim();
        bookingPayload.customer_email = email.trim();
        bookingPayload.notes = `Booking for ${name.trim()}`;
      } else {
        // For authenticated users, API will fetch name/email from database
        bookingPayload.notes = `Booking for authenticated user`;
      }

      const res = await fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && (user.id || (user as any).id) && { 'x-user-id': user.id || (user as any).id }), // Include user ID if logged in
          ...(!isAuthenticated && guestId ? { 'x-guest-id': guestId } : {}), // Guest identity for persistence
        },
        body: JSON.stringify(bookingPayload),
      });

      if (res.ok) {
        const data = await res.json();
        // If backend issued a new guest_id, persist it for future booking/messages.
        if (!user?.id && data?.guest_id && typeof data.guest_id === 'string') {
          setGuestId(data.guest_id);
          setGuestIdState(data.guest_id);
        }
        if (!user?.id && data?.guest_id) {
          alert(
            `${t('booking.bookingSuccessful') || 'Booking successful!'}\n\n` +
              `Guest ID: ${data.guest_id}\n` +
              `Save this Guest ID. You can use it to come back and continue messages later.`
          );
        } else {
          alert(t('booking.bookingSuccessful') || 'Booking successful!');
        }
        // Reset form (but keep customer profile data if logged in)
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTimeslot(null);
        setTimeslots([]);
        setAvailabilityChecked(false);
        if (!user) {
          // Only clear name/email for guest users
          setName('');
          setEmail('');
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: t('common.unknown') }));
        alert(`${t('booking.bookingFailed') || 'Booking failed'}: ${errorData.error || t('common.tryAgain') || 'Please try again'}`);
      }
    } catch (error: any) {
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error creating booking:', error);
        alert(t('booking.bookingFailed') || 'Failed to create booking');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('booking.bookAppointment')}</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseService')}</h2>
            <select
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('booking.selectService')}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseDate')}</h2>
            <input
              type="date"
              value={selectedDate || ''}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="mb-6">
            <button
              onClick={fetchAvailability}
              disabled={!selectedDate || loadingAvailability}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAvailability ? (t('booking.checking') || 'Checking...') : (t('booking.checkAvailability') || 'Check Availability')}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseTimeslot') || 'Choose Timeslot'}</h2>
            {loadingAvailability ? (
              <p className="text-gray-500 text-sm">{t('booking.checking') || 'Checking availability...'}</p>
            ) : availabilityChecked && timeslots.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('booking.noAvailability') || 'No available timeslots for this date. Please try another date.'}</p>
            ) : !availabilityChecked ? (
              <p className="text-gray-500 text-sm">{t('booking.clickCheckAvailability') || 'Click "Check Availability" to see available timeslots'}</p>
            ) : (
              <div className="space-y-2">
              {timeslots.map((timeslot) => (
                <button
                  key={timeslot.id}
                    onClick={() => setSelectedTimeslot(timeslot)}
                    className={`w-full px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors text-left ${
                      selectedTimeslot?.id === timeslot.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300'
                    }`}
                >
                  {timeslot.start_time} - {timeslot.end_time}
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Show customer information section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.yourInformation')}</h2>
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p>Debug: authLoading={String(authLoading)}, user={user ? `exists (id: ${user.id})` : 'null'}, customerProfile={customerProfile ? 'exists' : 'null'}</p>
              </div>
            )}
            
            {authLoading ? (
              // Show loading state while checking auth
              <div className="space-y-3">
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  {t('common.loading') || 'Loading...'}
                </div>
              </div>
            ) : (user && (user.id || (user as any).email)) ? (
              // Show customer info for authenticated users (read-only)
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking.yourName')}
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {customerProfile?.name || (user as any).name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.email')}
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {customerProfile?.email || user.email || (user as any).email || 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ✅ {t('booking.loggedInAs') || 'Logged in as'} {user.email || (user as any).email}
                  </p>
                </div>
              </div>
            ) : (
              // Show input fields for guest users only
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking.yourName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('booking.yourName')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder={t('booking.yourEmail') || t('common.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </>
            )}
          </div>

                  <button
            onClick={bookAppointment}
            disabled={authLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? t('common.loading') : t('booking.bookNow')}
                  </button>
        </div>

        {/* Right Column: AI Assistant */}
        <div className="space-y-6">
          {/* AI Assistant Placeholder */}
          {shopId && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Assistant</h3>
              <p className="text-gray-600">
                Chat with our AI assistant for help with booking and shop information.
              </p>
              </div>
          )}
        </div>

      </div>
    </div>
  );
}
