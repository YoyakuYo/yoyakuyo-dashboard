// apps/dashboard/app/book/[shopId]/page.tsx

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
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
  const [services, setServices] = useState<Service[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState<string>('');
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  
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

    try {
      const url = `${apiUrl}/shops/${shopId}/availability?date=${selectedDate}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTimeslots(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 0) {
          alert(t('booking.noAvailability') || 'No available timeslots for this date');
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch availability' }));
        alert(errorData.error || t('booking.availabilityError') || 'Failed to check availability');
        setTimeslots([]);
      }
    } catch (error: any) {
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("Error fetching availability:", error);
        alert(t('booking.availabilityError') || 'Failed to check availability');
      }
      setTimeslots([]);
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
    if (!name.trim()) {
      alert(t('booking.enterName') || 'Please enter your name');
      return;
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
      const res = await fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            shop_id: shopId,
            service_id: selectedService,
            customer_name: name.trim(),
            customer_email: email || null,
            date: selectedDate,
            time_slot: `${timeslotToUse.start_time}-${timeslotToUse.end_time}`,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes: `Booking for ${name}`,
          }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(t('booking.bookingSuccessful') || 'Booking successful!');
        // Reset form
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTimeslot(null);
        setTimeslots([]);
        setName('');
        setEmail('');
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
            {timeslots.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('booking.noTimeslots') || 'Click "Check Availability" to see available timeslots'}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {timeslots.map((timeslot) => (
                  <button
                    key={timeslot.id}
                    onClick={() => setSelectedTimeslot(timeslot)}
                    className={`px-4 py-2 border rounded-lg hover:bg-gray-50 ${
                      selectedTimeslot?.id === timeslot.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
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
            <input
              type="text"
              placeholder={t('booking.yourName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
            />
            <input
              type="email"
              placeholder={t('booking.yourEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
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
