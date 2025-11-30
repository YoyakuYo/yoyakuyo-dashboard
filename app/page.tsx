// apps/dashboard/app/page.tsx
// Redesigned Landing Page - Two-Column Layout Based on Travel Website Design

"use client";

import React, { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import CategoryGrid from './components/landing/CategoryGrid';
import OwnerModals from './components/OwnerModals';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Modal component
const Modal = React.memo(({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
      onClick={onClose}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

function HomeContent() {
  let t: ReturnType<typeof useTranslations>;
  let tAuth: ReturnType<typeof useTranslations>;
  let tLanding: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tAuth = useTranslations('auth');
    tLanding = useTranslations('landing');
  } catch (error) {
    console.warn("useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tLanding = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const categorySectionRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [featuredShops, setFeaturedShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Listen for events from header
  React.useEffect(() => {
    const handleOpenLogin = () => setShowLoginModal(true);
    const handleOpenJoin = () => setShowJoinModal(true);

    window.addEventListener('openLoginModal', handleOpenLogin);
    window.addEventListener('openJoinModal', handleOpenJoin);

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLogin);
      window.removeEventListener('openJoinModal', handleOpenJoin);
    };
  }, []);

  const scrollToCategories = () => {
    categorySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch recent reviews from database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const supabase = getSupabaseClient();
        
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            customer_id,
            shops (
              id,
              name,
              prefecture,
              city
            ),
            bookings (
              customer_name,
              customer_email
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching reviews:', error);
          setReviews([]);
        } else {
          setReviews(reviewsData || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, []);

  // Fetch featured shops
  useEffect(() => {
    const fetchFeaturedShops = async () => {
      try {
        setLoadingShops(true);
        const res = await fetch(`${apiUrl}/shops?page=1&limit=3`);
        if (res.ok) {
          const data = await res.json();
          const shopsArray = Array.isArray(data) 
            ? data 
            : (data.data && Array.isArray(data.data) 
              ? data.data 
              : (data.shops || []));
          
          const visibleShops = shopsArray.filter((shop: any) => 
            !shop.claim_status || shop.claim_status !== 'hidden'
          );
          
          setFeaturedShops(visibleShops.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading featured shops:', error);
        setFeaturedShops([]);
      } finally {
        setLoadingShops(false);
      }
    };

    fetchFeaturedShops();
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    alert('Thank you for subscribing!');
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — HERO (Split-Screen) */}
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-white">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div>
              <p className="text-orange-500 font-semibold text-sm uppercase tracking-wide mb-4">
                {tLanding('heroSubtitleLabel') || 'BEST SERVICES AROUND JAPAN'}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {tLanding('heroTitle') || "Travel, enjoy and book your perfect service"}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                {tLanding('heroDescription') || "Discover thousands of verified salons, clinics, hotels and more across Japan. Book instantly with AI assistance in your language."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={scrollToCategories}
                  className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition-all text-lg"
                >
                  {tLanding('findOutMore') || 'Find out more'}
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-8 py-4 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition-all text-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  {tLanding('playDemo') || 'Play Demo'}
                </button>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative hidden md:block">
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                  alt="Yoyaku Yo - Japan's Premier Booking Platform"
                  width={600}
                  height={600}
                  className="rounded-2xl shadow-2xl object-cover"
                  unoptimized={true}
                />
                {/* Decorative airplane shapes */}
                <div className="absolute -top-10 -right-10 w-20 h-20 opacity-30">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-blue-400">
                    <path d="M50 10 L60 30 L80 25 L70 45 L90 50 L70 55 L80 75 L60 70 L50 90 L40 70 L20 75 L30 55 L10 50 L30 45 L20 25 L40 30 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — SERVICES/CATEGORY (4 Cards) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide mb-2">
              {tLanding('categoryLabel') || 'CATEGORY'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {tLanding('weOfferBestServices') || 'We Offer Best Services'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Decorative plus signs */}
            <div className="absolute top-0 right-0 w-32 h-32 text-gray-200 text-6xl font-light opacity-30">+</div>
            <div className="absolute bottom-0 left-0 w-24 h-24 text-gray-200 text-4xl font-light opacity-30">+</div>
            
            {/* Service Card 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tLanding('calculatedWeather') || 'Smart Search'}
              </h3>
              <p className="text-gray-600 text-sm">
                {tLanding('calculatedWeatherDesc') || 'Find the perfect salon, clinic, or service based on location, category, and availability.'}
              </p>
            </div>

            {/* Service Card 2 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tLanding('bestFlights') || 'Best Booking'}
              </h3>
              <p className="text-gray-600 text-sm">
                {tLanding('bestFlightsDesc') || 'Book instantly with real-time availability. No phone calls needed.'}
              </p>
            </div>

            {/* Service Card 3 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tLanding('localEvents') || 'Local Events'}
              </h3>
              <p className="text-gray-600 text-sm">
                {tLanding('localEventsDesc') || 'Discover special promotions, events, and seasonal offers from top-rated shops.'}
              </p>
            </div>

            {/* Service Card 4 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tLanding('customization') || 'Customization'}
              </h3>
              <p className="text-gray-600 text-sm">
                {tLanding('customizationDesc') || 'Personalize your booking experience with AI assistance in multiple languages.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — TOP SHOPS (Like Top Destinations) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide mb-2">
              {tLanding('topSelling') || 'TOP SELLING'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {tLanding('topShops') || 'Top Shops'}
            </h2>
          </div>

          {loadingShops ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading shops...'}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredShops.map((shop, index) => {
                const imageUrl = shop.cover_photo_url || shop.image_url || shop.logo_url;
                return (
                  <Link
                    key={shop.id}
                    href={`/browse?shop=${shop.id}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="relative h-64">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={shop.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{shop.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{shop.prefecture || shop.city || 'Japan'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-bold">
                          {tLanding('viewDetails') || 'View Details'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {tLanding('bookNow') || 'Book Now →'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4 — BOOKING STEPS (3 Easy Steps) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Steps */}
            <div>
              <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide mb-2">
                {tLanding('easyAndFast') || 'EASY AND FAST'}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                {tLanding('bookNextTrip') || 'Book Your Next Service In 3 Easy Steps'}
              </h2>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-gray-900">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tLanding('chooseDestination') || 'Choose Service'}
                    </h3>
                    <p className="text-gray-600">
                      {tLanding('chooseDestinationDesc') || 'Browse by category or location. Find the perfect salon, clinic, or service for your needs.'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tLanding('makePayment') || 'Make Payment'}
                    </h3>
                    <p className="text-gray-600">
                      {tLanding('makePaymentDesc') || 'Select your preferred date and time. Complete booking with secure payment or pay at the shop.'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tLanding('reachAirport') || 'Get Confirmation'}
                    </h3>
                    <p className="text-gray-600">
                      {tLanding('reachAirportDesc') || 'Receive instant confirmation via email. Show up at the selected date and time for your service.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking Card */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80"
                    alt="Booking Example"
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {tLanding('tripToGreece') || 'Hair Salon Booking'}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {tLanding('bookingDates') || '14-29 June'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{tLanding('byOwner') || 'by shop owner'}</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {tLanding('peopleGoing') || '24 people going'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — TESTIMONIALS */}
      {reviews.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-12">
              <p className="text-gray-500 font-semibold text-sm uppercase tracking-wide mb-2">
                {tLanding('testimonialsLabel') || 'TESTIMONIALS'}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {tLanding('whatPeopleSay') || 'What People Say About Us'}
              </h2>
            </div>

            {loadingReviews ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('common.loading') || 'Loading reviews...'}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {reviews.slice(0, 3).map((review, index) => {
                  const shop = review.shops as any;
                  const booking = review.bookings as any;
                  const customerName = booking?.customer_name || 'Anonymous';
                  const location = shop?.prefecture || shop?.city || 'Japan';
                  
                  return (
                    <div key={review.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 relative">
                      <p className="text-gray-700 mb-6 italic">
                        "{review.comment}"
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{customerName}</div>
                          <div className="text-sm text-gray-600">{location}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 6 — PARTNER LOGOS */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            <div className="text-gray-400 font-semibold text-lg">Tokyo</div>
            <div className="text-gray-400 font-semibold text-lg">Osaka</div>
            <div className="text-gray-400 font-semibold text-lg">Kyoto</div>
            <div className="text-gray-400 font-semibold text-lg">Yokohama</div>
            <div className="text-gray-400 font-semibold text-lg">Sapporo</div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — NEWSLETTER */}
      <section className="py-16 md:py-24 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {tLanding('subscribeTitle') || 'Subscribe to get information, latest news and other interesting offers about Yoyaku Yo'}
          </h2>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder={tLanding('yourEmail') || 'Your email'}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tLanding('subscribe') || 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      {/* SECTION 8 — BROWSE BY CATEGORY GRID */}
      <section ref={categorySectionRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {tLanding('browseByCategoryTitle') || 'Browse by Category'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tLanding('marketplaceSubtitle') || 'Discover services across 15+ categories'}
            </p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* SECTION 9 — FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Yoyaku Yo</h3>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{tLanding('company') || 'Company'}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white">{tLanding('footerAbout') || 'About'}</Link></li>
                <li><Link href="/careers" className="hover:text-white">{tLanding('careers') || 'Careers'}</Link></li>
                <li><Link href="/mobile" className="hover:text-white">{tLanding('mobile') || 'Mobile'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{tLanding('contact') || 'Contact'}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/help" className="hover:text-white">{tLanding('helpFAQ') || 'Help/FAQ'}</Link></li>
                <li><Link href="/press" className="hover:text-white">{tLanding('press') || 'Press'}</Link></li>
                <li><Link href="/affiliates" className="hover:text-white">{tLanding('affiliates') || 'Affiliates'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{tLanding('more') || 'More'}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/privacy" className="hover:text-white">{tLanding('footerPrivacy') || 'Privacy Policy'}</Link></li>
                <li><Link href="/terms" className="hover:text-white">{tLanding('footerTerms') || 'Terms'}</Link></li>
                <li><Link href="/contact" className="hover:text-white">{tLanding('footerContact') || 'Contact'}</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Yoyaku Yo. {tLanding('footerRights') || 'All rights reserved.'}
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {tAuth('signIn') || 'Login'}
        </h2>
        <div className="space-y-4">
          <Link
            href="/customer-login"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            onClick={() => setShowLoginModal(false)}
          >
            {tAuth('loginAsCustomer') || 'Login as Customer'}
          </Link>
          <button
            onClick={() => {
              setShowLoginModal(false);
              window.dispatchEvent(new CustomEvent('openLoginModal'));
            }}
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
          >
            {tAuth('loginAsOwner') || 'Login as Owner'}
          </button>
        </div>
      </Modal>

      {/* JOIN MODAL */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {tLanding('createAccountTitle') || 'Create an account'}
        </h2>
        <div className="space-y-4">
          <Link
            href="/customer-signup"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            onClick={() => setShowJoinModal(false)}
          >
            {tAuth('joinAsCustomer') || 'Join as Customer'}
          </Link>
          <button
            onClick={() => {
              setShowJoinModal(false);
              window.dispatchEvent(new CustomEvent('openSignupModal'));
            }}
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
          >
            {tAuth('joinAsOwner') || 'Join as Owner'}
          </button>
        </div>
      </Modal>

      {/* Owner Login/Signup Modals */}
      <OwnerModals />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
