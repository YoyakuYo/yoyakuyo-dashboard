// apps/dashboard/app/page.tsx
// Business Landing Page Template - Matching the provided design

"use client";

import React, { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import OwnerModals from './components/OwnerModals';
import { getSupabaseClient } from '@/lib/supabaseClient';

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
  const featuresRef = useRef<HTMLDivElement>(null);

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

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — HERO (Full-Width with Gradient Overlay) */}
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Modern building"
            fill
            className="object-cover"
            priority
            unoptimized={true}
          />
          {/* Blue-to-Purple Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-blue-500/70 to-purple-600/80"></div>
        </div>

        {/* Navigation Bar */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">
              YOYAKU YO
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-white hover:text-blue-200 transition-colors font-medium">
                HOME
              </Link>
              <Link href="/about" className="text-white hover:text-blue-200 transition-colors font-medium">
                ABOUT
              </Link>
              <Link href="/browse" className="text-white hover:text-blue-200 transition-colors font-medium">
                SERVICES
              </Link>
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-white hover:text-blue-200 transition-colors font-medium"
              >
                CONTACT
              </button>
            </nav>
          </div>
        </div>

        {/* Centered Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-32 pb-20 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 uppercase tracking-tight">
            {tLanding('heroMainTitle') || 'YOYAKU YO'}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-cyan-300 mb-6 uppercase tracking-wide font-light">
            {tLanding('heroSubtitle') || "JAPAN'S PREMIER BOOKING PLATFORM"}
          </p>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {tLanding('heroDescription') || "Discover thousands of verified salons, clinics, hotels and more across Japan. Book instantly with AI assistance in your language."}
          </p>
          <button
            onClick={scrollToFeatures}
            className="px-8 py-4 bg-cyan-400 text-gray-900 font-bold rounded-lg shadow-lg hover:bg-cyan-300 transition-all text-lg border-2 border-cyan-500"
          >
            {tLanding('moreButton') || 'MORE'}
          </button>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0,120 L48,110 C96,100 192,80 288,70 C384,60 480,60 576,65 C672,70 768,80 864,85 C960,90 1056,90 1152,85 C1248,80 1344,70 1392,65 L1440,60 L1440,120 L1392,120 C1344,120 1248,120 1152,120 C1056,120 960,120 864,120 C768,120 672,120 576,120 C480,120 384,120 288,120 C192,120 96,120 48,120 L0,120 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* SECTION 2 — FEATURES (4 Blocks) */}
      <section ref={featuresRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 - Analytics/Stats */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l8 0M3 6l13 0M3 20l8 0M3 13l8 0M3 6l13 0M3 20l8 0M11 6l10 0M11 13l10 0M11 20l10 0" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">
                {tLanding('feature1Title') || 'Smart Analytics'}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {tLanding('feature1Desc') || 'Track your bookings and discover the best services with our intelligent analytics system.'}
              </p>
            </div>

            {/* Feature 2 - Platform/Desktop */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">
                {tLanding('feature2Title') || 'Multi-Platform'}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {tLanding('feature2Desc') || 'Access Yoyaku Yo from any device - desktop, tablet, or mobile. Book anywhere, anytime.'}
              </p>
            </div>

            {/* Feature 3 - Communication/Chat */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">
                {tLanding('feature3Title') || 'AI Chat Support'}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {tLanding('feature3Desc') || 'Get instant help with our AI-powered chat support available in multiple languages 24/7.'}
              </p>
            </div>

            {/* Feature 4 - Verified/Checkmark */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">
                {tLanding('feature4Title') || 'Verified Shops'}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {tLanding('feature4Desc') || 'All shops are verified and reviewed. Book with confidence knowing you\'re getting quality service.'}
              </p>
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
