// apps/dashboard/app/page.tsx
// Enhanced Clean White/Blue Public Landing Page

"use client";

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import CategoryGrid from './components/landing/CategoryGrid';
import OwnerModals from './components/OwnerModals';

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
  const howItWorksRef = useRef<HTMLDivElement>(null);

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

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — ENHANCED HERO (Split-Screen) */}
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500">
        <div className="absolute inset-0">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {tLanding('heroTitle') || "Book beauty, wellness & hospitality across Japan"}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                {tLanding('heroSubtitle') || "Find salons, clinics, hotels and more — with AI helping you book in your language."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={scrollToCategories}
                  className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-xl hover:bg-gray-100 transition-all text-lg"
                >
                  {tLanding('browseCategories') || 'Browse Categories'}
                </button>
                <button
                  onClick={scrollToHowItWorks}
                  className="px-8 py-4 bg-transparent text-white font-bold rounded-lg shadow-xl hover:bg-white/10 transition-all text-lg border-2 border-white"
                >
                  {tLanding('howItWorks') || 'How it works'}
                </button>
              </div>
              
              {/* Stats badges */}
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="text-2xl font-bold">10K+</span>
                  <span className="text-sm">Shops</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="text-2xl font-bold">47</span>
                  <span className="text-sm">Prefectures</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="text-2xl font-bold">24/7</span>
                  <span className="text-sm">AI Support</span>
                </div>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative hidden md:block">
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80"
                  alt="Yoyaku Yo - Japan's Premier Booking Platform"
                  width={600}
                  height={600}
                  className="rounded-2xl shadow-2xl object-cover"
                  unoptimized={true}
                />
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-white rounded-full px-6 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <div className="text-sm font-bold text-gray-900">4.9 Rating</div>
                      <div className="text-xs text-gray-600">From 5K+ reviews</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — SOCIAL PROOF */}
      <section className="py-8 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-600 text-sm mb-4">
            {tLanding('trustedBy') || 'Trusted by thousands of customers across Japan'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {/* Partner logos - using text for now, can be replaced with actual logos */}
            <div className="text-gray-400 font-semibold text-lg">Tokyo</div>
            <div className="text-gray-400 font-semibold text-lg">Osaka</div>
            <div className="text-gray-400 font-semibold text-lg">Kyoto</div>
            <div className="text-gray-400 font-semibold text-lg">Yokohama</div>
            <div className="text-gray-400 font-semibold text-lg">Sapporo</div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — ENHANCED MARKETING BOXES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {tLanding('featuresTitle') || 'Our Amazing Features Helpful for Your Business'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tLanding('featuresSubtitle') || 'Everything you need to discover and book the best services in Japan'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Box 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {tLanding('marketingCard1Title') || 'Search the best salons, clinics & experiences in Japan'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('marketingCard1Text') || 'Discover thousands of verified businesses across multiple categories and regions.'}
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {tLanding('marketingCard2Title') || 'AI-powered booking assistance'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('marketingCard2Text') || 'Our AI helps you find available times, answers questions, and handles bookings in multiple languages.'}
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {tLanding('marketingCard3Title') || 'Save time, book instantly'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('marketingCard3Text') || 'No more phone calls. Compare shops, save favorites, and manage bookings in one place.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — TWO-COLUMN FEATURES */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl"></div>
              <Image
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"
                alt="Yoyaku Yo Features"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl relative z-10"
                unoptimized={true}
              />
            </div>

            {/* Right: Features List */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {tLanding('collectReviewsTitle') || 'Why Choose Yoyaku Yo?'}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {tLanding('collectReviewsDesc') || 'Experience the best booking platform in Japan with AI-powered assistance and thousands of verified shops.'}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tLanding('feature1Title') || 'Top Rated Shops'}</h3>
                    <p className="text-gray-600">{tLanding('feature1Desc') || 'Discover the highest-rated salons, clinics, and services across Japan'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tLanding('feature2Title') || 'Instant Booking'}</h3>
                    <p className="text-gray-600">{tLanding('feature2Desc') || 'Book your favorite services instantly with real-time availability'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tLanding('feature3Title') || 'Save Favorites'}</h3>
                    <p className="text-gray-600">{tLanding('feature3Desc') || 'Save your favorite shops and access them anytime for quick booking'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — BROWSE BY CATEGORY GRID */}
      <section ref={categorySectionRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {tLanding('browseByCategoryTitle') || 'Explore the Marketplace'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tLanding('marketplaceSubtitle') || 'Discover services across 15+ categories'}
            </p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* SECTION 6 — STATS CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 mb-6">
              <span className="text-5xl md:text-6xl font-bold text-white">15K+</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {tLanding('statsCTATitle') || 'Book Japan\'s Best Services'}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {tLanding('statsCTADesc') || 'Join thousands of customers who trust Yoyaku Yo for their booking needs'}
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-xl hover:bg-gray-100 transition-all text-lg"
            >
              {tLanding('findProfile') || 'Get Started'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 7 — TESTIMONIALS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {tLanding('testimonialsTitle') || 'Check Out Recent Reviews'}
            </h2>
            <p className="text-lg text-gray-600">
              {tLanding('testimonialsSubtitle') || 'See what our customers are saying'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah M.</div>
                  <div className="text-sm text-gray-600">Tokyo, Japan</div>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-700">
                {tLanding('review1Text') || '"Amazing experience! Found the perfect salon in minutes. The AI assistant was incredibly helpful."'}
              </p>
            </div>

            {/* Review 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Kenji T.</div>
                  <div className="text-sm text-gray-600">Osaka, Japan</div>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-700">
                {tLanding('review2Text') || '"Booking was so easy! The platform helped me discover new places I never knew existed."'}
              </p>
            </div>

            {/* Review 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria L.</div>
                  <div className="text-sm text-gray-600">Kyoto, Japan</div>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">⭐</span>
                ))}
              </div>
              <p className="text-gray-700">
                {tLanding('review3Text') || '"As a shop owner, the AI messaging feature has saved me so much time. Highly recommended!"'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — HOW IT WORKS */}
      <section ref={howItWorksRef} className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {tLanding('howItWorksTitle') || t('home.howItWorks') || 'How It Works'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Card A - For Customers */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {tLanding('howItWorksCustomersTitle') || 'For Customers'}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksCustomersBullet1') || 'Search shops by category or location'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksCustomersBullet2') || 'Book instantly with AI assistance'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksCustomersBullet3') || 'Save favorites and view booking history'}</span>
                </li>
              </ul>
            </div>

            {/* Card B - For Owners */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">💼</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {tLanding('howItWorksOwnersTitle') || 'For Owners'}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksOwnersBullet1') || 'Manage bookings & availability'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksOwnersBullet2') || 'Handle customer messages automatically with AI'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksOwnersBullet3') || 'View performance with a simple dashboard'}</span>
                </li>
              </ul>
            </div>

            {/* Card C - AI Assistance */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">🤖</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {tLanding('howItWorksAITitle') || 'AI Assistance'}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksAIBullet1') || 'Chats with customers in Japanese, English, Spanish, Chinese, Portuguese'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksAIBullet2') || 'Handles scheduling, rescheduling, and cancellations'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('howItWorksAIBullet3') || 'Available 24/7'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTAs */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Customers CTA */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {tLanding('ctaCustomersTitle') || 'For Customers'}
              </h3>
              <p className="text-gray-600 mb-6">
                {tLanding('ctaCustomersDesc') || 'Join thousands of customers who book faster with AI assistance'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {tAuth('signIn') || 'Login'}
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors border-2 border-blue-600"
                >
                  {tAuth('signUp') || 'Join'}
                </button>
              </div>
            </div>

            {/* For Owners CTA */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {tLanding('ctaOwnersTitle') || 'For Owners'}
              </h3>
              <p className="text-gray-600 mb-6">
                {tLanding('ctaOwnersDesc') || 'Automate customer messages and grow your business effortlessly'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    window.dispatchEvent(new CustomEvent('openLoginModal'));
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {tAuth('signIn') || 'Login'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    window.dispatchEvent(new CustomEvent('openSignupModal'));
                  }}
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors border-2 border-blue-600"
                >
                  {tAuth('signUp') || 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold">
              Yoyaku Yo
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                {tLanding('footerAbout') || 'About'}
              </Link>
              <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                {tLanding('footerPrivacy') || 'Privacy Policy'}
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                {tLanding('footerTerms') || 'Terms'}
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                {tLanding('footerContact') || 'Contact'}
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400 text-sm">
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
