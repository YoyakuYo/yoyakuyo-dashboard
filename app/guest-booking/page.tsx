"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';
import Link from 'next/link';

interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface Service {
  id: string;
  name: string;
  price?: number;
  duration?: number;
}

export default function GuestBookingPage() {
  const router = useRouter();
  const t = useTranslations();
  const [shops, setShops] = useState<Shop[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Form fields
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  // Load shops on mount
  useEffect(() => {
    const loadShops = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('shops')
          .select('id, name, address, phone')
          .order('name', { ascending: true })
          .limit(1000);

        if (error) {
          console.error('Error loading shops:', error);
          setShops([]);
        } else {
          setShops(data || []);
        }
      } catch (err) {
        console.error('Error loading shops:', err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    loadShops();
  }, []);

  // Load services when shop is selected
  useEffect(() => {
    if (!selectedShopId) {
      setServices([]);
      setSelectedServiceId('');
      return;
    }

    const loadServices = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${selectedShopId}/services`);
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : []);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error('Error loading services:', err);
        setServices([]);
      }
    };

    loadServices();
  }, [selectedShopId, apiUrl]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Generate time slots (9 AM to 9 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!selectedShopId || !selectedServiceId || !customerName || !customerEmail || !selectedDate || !selectedTime) {
      setError(t('booking.fillRequiredFields') || 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError(t('booking.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time into ISO string
      const dateTimeString = `${selectedDate}T${selectedTime}:00`;
      const startTime = new Date(dateTimeString).toISOString();
      
      // Calculate end time (default 1 hour, or use service duration if available)
      const selectedService = services.find(s => s.id === selectedServiceId);
      const durationMinutes = selectedService?.duration || 60;
      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60 * 1000).toISOString();

      const res = await fetch(`${apiUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: selectedShopId,
          service_id: selectedServiceId,
          start_time: startTime,
          end_time: endTime,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingId(data.id);
        setSuccess(true);
        
        // Reset form
        setSelectedShopId('');
        setSelectedServiceId('');
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setSelectedDate('');
        setSelectedTime('');
        setNotes('');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || t('booking.bookingFailed') || 'Failed to create booking');
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(t('booking.bookingFailed') || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (success && bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('booking.bookingSuccessful') || 'Booking Successful!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('booking.confirmationEmailSent') || 'A confirmation email has been sent to your email address.'}
          </p>
          <div className="space-y-3">
            <Link
              href={`/guest-booking/${bookingId}`}
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('booking.viewBookingDetails') || 'View Booking Details'}
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {t('common.backToHome') || 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('booking.guestBooking') || 'Book as Guest'}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('booking.guestBookingDesc') || 'No account required. Fill in your details to make a booking.'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Selection */}
            <div>
              <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-2">
                {t('booking.selectShop') || 'Select Shop'} <span className="text-red-500">*</span>
              </label>
              <select
                id="shop"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('booking.chooseShop') || 'Choose a shop...'}</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Selection */}
            {selectedShopId && (
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('booking.selectService') || 'Select Service'} <span className="text-red-500">*</span>
                </label>
                <select
                  id="service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
                  disabled={services.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">
                    {services.length === 0 
                      ? (t('booking.loadingServices') || 'Loading services...')
                      : (t('booking.chooseService') || 'Choose a service...')}
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} {service.price ? `(${service.price}¥)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.name') || 'Name'} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('booking.yourName') || 'Your full name'}
              />
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.email') || 'Email'} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.phone') || 'Phone'} <span className="text-gray-400 text-xs">({t('common.optional') || 'Optional'})</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('booking.yourPhone') || 'Your phone number'}
              />
            </div>

            {/* Date Selection */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.date') || 'Date'} <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.time') || 'Time'} <span className="text-red-500">*</span>
                </label>
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('booking.chooseTime') || 'Choose a time...'}</option>
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                {t('booking.notes') || 'Notes'} <span className="text-gray-400 text-xs">({t('common.optional') || 'Optional'})</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('booking.additionalNotes') || 'Any special requests or notes...'}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (t('booking.submitting') || 'Submitting...') : (t('booking.submitBooking') || 'Submit Booking')}
              </button>
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </Link>
            </div>

            {/* Login/Signup Links */}
            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">
                {t('booking.haveAccount') || 'Have an account?'}
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/customer-login"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {t('auth.signIn') || 'Sign In'}
                </Link>
                <span className="text-gray-400">|</span>
                <Link
                  href="/customer-signup"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {t('auth.signUp') || 'Sign Up'}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

