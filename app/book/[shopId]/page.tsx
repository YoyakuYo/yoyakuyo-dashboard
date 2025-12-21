// apps/dashboard/app/book/[shopId]/page.tsx

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import { useCustomAuth } from '@/lib/useCustomAuth';
import { BrowseAIAssistant } from '@/app/browse/components/BrowseAIAssistant';

interface Service {
  id: string;
  name: string;
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
  const { user } = useCustomAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
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
    }
  }, []);

  // Load customer profile if user is logged in
  useEffect(() => {
    if (user?.id) {
      const loadCustomerProfile = async () => {
        const supabase = getSupabaseClient();
        const { data: profile } = await supabase
          .from("customer_profiles")
          .select("name, email, full_name")
          .eq("customer_auth_id", user.id)
          .maybeSingle();

        if (profile) {
          const profileName = profile.full_name || profile.name || user.name || user.email?.split('@')[0] || '';
          const profileEmail = profile.email || user.email || '';
          setCustomerProfile({ name: profileName, email: profileEmail });
          setName(profileName);
          setEmail(profileEmail);
        } else {
          // Fallback to user data if profile not found
          const userName = user.name || user.email?.split('@')[0] || '';
          const userEmail = user.email || '';
          setCustomerProfile({ name: userName, email: userEmail });
          setName(userName);
          setEmail(userEmail);
        }
      };
      loadCustomerProfile();
    }
  }, [user]);

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
    // Validation
    if (!selectedService) {
      alert(t('booking.selectService') || 'Please select a service');
      return;
    }
    if (!selectedDate) {
      alert(t('booking.selectDate') || 'Please select a date');
      return;
    }
    if (!selectedTimeslot && timeslots.length === 0) {
      alert(t('booking.selectTimeslot') || 'Please check availability and select a timeslot');
      return;
    }
    
    // For guest users, validate name and email
    if (!user) {
      if (!name.trim()) {
        alert(t('booking.enterName') || 'Please enter your name');
        return;
      }
      if (!email.trim()) {
        alert(t('booking.enterEmail') || 'Please enter your email');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert(t('booking.invalidEmail') || 'Please enter a valid email address');
        return;
      }
    } else {
      // For logged-in users, use customer profile data
      const finalName = customerProfile?.name || name || user.name || user.email?.split('@')[0] || 'Customer';
      const finalEmail = customerProfile?.email || email || user.email || '';
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
      // Use customer profile data if logged in, otherwise use form input
      const finalName = user && customerProfile 
        ? customerProfile.name 
        : name.trim();
      const finalEmail = user && customerProfile 
        ? customerProfile.email 
        : email.trim();

      const res = await fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id && { 'x-user-id': user.id }), // Include user ID if logged in
        },
        body: JSON.stringify({
          shop_id: shopId,
          service_id: selectedService,
          customer_name: finalName,
          customer_email: finalEmail || null,
          date: selectedDate,
          time_slot: `${timeslotToUse.start_time}-${timeslotToUse.end_time}`,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          notes: `Booking for ${finalName}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(t('booking.bookingSuccessful') || 'Booking successful!');
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
              <div className="grid grid-cols-2 gap-2">
                {timeslots.map((timeslot) => (
                  <button
                    key={timeslot.id}
                    onClick={() => setSelectedTimeslot(timeslot)}
                    className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
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

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.yourInformation')}</h2>
            {user && customerProfile ? (
              // Show customer info for logged-in users (read-only)
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking.yourName')}
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {customerProfile.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.email')}
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {customerProfile.email}
                  </div>
                </div>
              </div>
            ) : (
              // Show input fields for guest users
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
            disabled={bookingLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bookingLoading ? (t('booking.booking') || 'Booking...') : (t('booking.submit') || 'Book Now')}
          </button>
        </div>

        {/* Right Column: AI Assistant */}
        <div className="space-y-6">
          {/* AI Assistant */}
          {shopId && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <BrowseAIAssistant
                shops={shopName ? [{ id: shopId, name: shopName }] : []}
                locale={t('common.locale') || 'en'}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
