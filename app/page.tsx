// apps/dashboard/app/page.tsx
// Spa/Beauty Landing Page Design - Matching Wellnez template

"use client";

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
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
  const [showSearch, setShowSearch] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

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

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">Y</span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-amber-900">
                Yoyaku Yo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href="/browse" className="text-amber-900 hover:text-amber-700 transition-colors font-medium">
                {tLanding('navBrowse') || 'BROWSE'}
              </Link>
              <Link href="/about" className="text-amber-900 hover:text-amber-700 transition-colors font-medium">
                {tLanding('navAbout') || 'ABOUT US'}
              </Link>
              <Link href="/browse" className="text-amber-900 hover:text-amber-700 transition-colors font-medium">
                {tLanding('navServices') || 'SERVICES'}
              </Link>
              <Link href="/blog" className="text-amber-900 hover:text-amber-700 transition-colors font-medium">
                {tLanding('navBlog') || 'BLOG'}
              </Link>
              <Link href="/contact" className="text-amber-900 hover:text-amber-700 transition-colors font-medium">
                {tLanding('navContact') || 'CONTACT US'}
              </Link>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="text-amber-900 hover:text-amber-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
              >
                {tLanding('navBook') || 'BOOK'}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button className="lg:hidden text-amber-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[600px] md:min-h-[700px] bg-gradient-to-br from-amber-50 via-white to-amber-50 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-700">
              <path d="M50 10 Q70 30 90 50 Q70 70 50 90 Q30 70 10 50 Q30 30 50 10 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-20 right-10 w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-700">
              <path d="M50 20 Q60 40 80 50 Q60 60 50 80 Q40 60 20 50 Q40 40 50 20 Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content & Pricing Cards */}
            <div>
              <p className="text-amber-700 font-light text-sm uppercase tracking-widest mb-2">
                {tLanding('heroTagline') || 'BOOKING INSPIRES'}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-4 leading-tight">
                {tLanding('heroMainTitle') || 'YOYAKU YO'}
              </h1>
              <p className="text-2xl md:text-3xl font-light text-amber-800 mb-8">
                {tLanding('heroSubtitle') || "Japan's Premier Booking Platform"}
              </p>

              {/* Pricing Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 border border-amber-200 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-amber-700 mb-2">¥1,000</div>
                  <div className="text-sm text-amber-900 font-medium mb-3">{tLanding('basicPlan') || 'Basic Plan'}</div>
                  <div className="text-xs text-gray-600 mb-4">{tLanding('basicPlanDesc') || 'For 1 person'}</div>
                  <div className="w-full h-32 bg-amber-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-4xl">🌸</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-amber-200 hover:shadow-lg transition-all">
                  <div className="text-3xl font-bold text-amber-700 mb-2">¥4,900</div>
                  <div className="text-sm text-amber-900 font-medium mb-3">{tLanding('megaPlan') || 'Mega Plan'}</div>
                  <div className="text-xs text-gray-600 mb-4">{tLanding('megaPlanDesc') || 'For 3 persons'}</div>
                  <div className="w-full h-32 bg-amber-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-4xl">🌺</span>
                  </div>
                </div>
              </div>

              <button
                onClick={scrollToServices}
                className="w-full md:w-auto px-8 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
              >
                {tLanding('weddingPackage') || 'View All Packages'}
              </button>
            </div>

            {/* Right: Large Image */}
            <div className="relative hidden md:block">
              <div className="relative w-full h-[500px] md:h-[600px]">
                <Image
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80"
                  alt="Yoyaku Yo - Japan's Premier Booking Platform"
                  fill
                  className="object-cover rounded-2xl shadow-xl"
                  priority
                  unoptimized={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section ref={servicesRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-amber-700 font-light text-sm uppercase tracking-widest mb-2">
              {tLanding('servicesTagline') || 'DISCOVER OUR SERVICES'}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              {tLanding('servicesTitle') || 'Facials & Body Treatments'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-amber-100 hover:shadow-lg transition-all text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-amber-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-3">
                {tLanding('service1Title') || 'Skin Treatment'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {tLanding('service1Desc') || 'Professional skincare treatments for all skin types.'}
              </p>
              <button className="text-amber-700 hover:text-amber-800 font-medium text-sm">
                {tLanding('readMore') || 'READ MORE →'}
              </button>
            </div>

            {/* Service Card 2 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-amber-100 hover:shadow-lg transition-all text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-amber-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-3">
                {tLanding('service2Title') || 'Body Treatments'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {tLanding('service2Desc') || 'Relaxing body massages and therapeutic treatments.'}
              </p>
              <button className="text-amber-700 hover:text-amber-800 font-medium text-sm">
                {tLanding('readMore') || 'READ MORE →'}
              </button>
            </div>

            {/* Service Card 3 */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-amber-100 hover:shadow-lg transition-all text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-amber-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-3">
                {tLanding('service3Title') || 'Clean Ingredients'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {tLanding('service3Desc') || 'Natural and organic products for your wellness.'}
              </p>
              <button className="text-amber-700 hover:text-amber-800 font-medium text-sm">
                {tLanding('readMore') || 'READ MORE →'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LOGIN MODAL */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {tAuth('signIn') || 'Login'}
        </h2>
        <div className="space-y-4">
          <Link
            href="/customer-login"
            className="block w-full bg-amber-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-800 transition-colors text-center"
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
            className="block w-full bg-amber-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-amber-800 transition-colors text-center"
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
