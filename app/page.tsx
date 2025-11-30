// apps/dashboard/app/page.tsx
// Luxury Pink + Gold Public Landing Page

"use client";

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto"
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
  const router = useRouter();
  const categorySectionRef = useRef<HTMLDivElement>(null);
  
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

  const [showAccessModal, setShowAccessModal] = useState(false);

  const scrollToCategories = () => {
    categorySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — HERO */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80"
            alt="Yoyaku Yo"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized={true}
          />
        </div>

        {/* Pink/Gold Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/60 via-pink-800/50 to-amber-900/60" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              {tLanding('heroTitle') || 'Find Beauty, Wellness & Hospitality — Instantly.'}
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 drop-shadow-md mb-8">
              {tLanding('heroSubtitle') || "Book salons, clinics, hotels & more across Japan with AI assistance."}
            </p>
            <button
              onClick={scrollToCategories}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-amber-500 text-white font-bold rounded-lg shadow-lg hover:from-pink-600 hover:to-amber-600 transition-all text-lg transform hover:scale-105"
            >
              {tLanding('browseCategories') || 'Browse Categories'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — FEATURE CARDS (3-CARD ROW) */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-pink-100 hover:border-pink-300 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {tLanding('featureCard1Title') || 'Smart AI Booking'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('featureCard1Text') || 'Let AI find the right shop and complete the booking for you.'}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-pink-100 hover:border-pink-300 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {tLanding('featureCard2Title') || 'Thousands of Shops'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('featureCard2Text') || 'Nails, hair, clinics, hotels, restaurants—across all prefectures.'}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-pink-100 hover:border-pink-300 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-amber-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {tLanding('featureCard3Title') || 'Fast & Simple'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('featureCard3Text') || 'Skip phone calls. Book in seconds.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — BROWSE BY CATEGORY GRID */}
      <section ref={categorySectionRef} className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {tLanding('browseByCategoryTitle') || 'Browse by Category'}
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* SECTION 4 — WHY YOYAKUYO */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80"
                alt="Why YoyakuYo"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={true}
              />
            </div>

            {/* Right: Benefits List */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                {tLanding('whyYoyakuYoTitle') || 'Why YoyakuYo'}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg">
                    {tLanding('whyBenefit1') || 'AI helps you search faster and compare options.'}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg">
                    {tLanding('whyBenefit2') || 'Find places near you or anywhere in Japan.'}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg">
                    {tLanding('whyBenefit3') || 'Book in seconds and get confirmations instantly.'}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-4">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-lg">
                    {tLanding('whyBenefit4') || 'Save your favorite shops and revisit them anytime.'}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — CTA BANNER */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-pink-500 via-pink-600 to-amber-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {tLanding('ctaBannerTitle') || "Join YoyakuYo and discover Japan's best beauty, wellness & hospitality."}
          </h2>
          <button
            onClick={() => setShowAccessModal(true)}
            className="px-8 py-4 bg-white text-pink-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-all text-lg transform hover:scale-105"
          >
            {tLanding('ctaBannerButton') || 'Get Started'}
          </button>
        </div>
      </section>

      {/* SECTION 6 — FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold">
              {tLanding('heroTitle') || 'Yoyaku Yo'}
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

      {/* ACCESS MODAL */}
      <Modal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)}>
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {tLanding('accessModalTitle') || 'Get Started'}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* COLUMN A — CUSTOMERS */}
          <div className="border-2 border-pink-200 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {tLanding('forCustomersTitle') || 'For Customers'}
            </h3>
            <div className="space-y-4">
              <Link
                href="/customer-login"
                className="block w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition-colors text-center"
                onClick={() => setShowAccessModal(false)}
              >
                {tAuth('customerLogin') || 'Customer Login'}
              </Link>
              <Link
                href="/customer-signup"
                className="block w-full bg-pink-100 text-pink-700 py-3 px-6 rounded-lg font-semibold hover:bg-pink-200 transition-colors text-center border-2 border-pink-300"
                onClick={() => setShowAccessModal(false)}
              >
                {tAuth('signUpAsCustomer') || 'Sign Up as Customer'}
              </Link>
            </div>
          </div>

          {/* COLUMN B — OWNERS */}
          <div className="border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {tLanding('forOwnersTitle') || 'For Owners'}
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAccessModal(false);
                  window.dispatchEvent(new CustomEvent('openLoginModal'));
                }}
                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                {tAuth('ownerLogin') || 'Owner Login'}
              </button>
              <button
                onClick={() => {
                  setShowAccessModal(false);
                  window.dispatchEvent(new CustomEvent('openSignupModal'));
                }}
                className="block w-full bg-blue-100 text-blue-700 py-3 px-6 rounded-lg font-semibold hover:bg-blue-200 transition-colors text-center border-2 border-blue-300"
              >
                {tAuth('joinAsOwner') || 'Join as Owner'}
              </button>
            </div>
          </div>
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

