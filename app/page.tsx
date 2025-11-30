// apps/dashboard/app/page.tsx
// Completely Rebuilt Public Landing Page

"use client";

import React, { useState, Suspense } from 'react';
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
  
  let t: ReturnType<typeof useTranslations>;
  let tAuth: ReturnType<typeof useTranslations>;
  let tLanding: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tAuth = useTranslations('auth');
    tLanding = useTranslations('landing');
  } catch (error) {
    console.warn("🔥 useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tLanding = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [showAccessModal, setShowAccessModal] = useState(false);

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

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              {tLanding('heroTitle') || 'Yoyaku Yo'}
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 drop-shadow-md mb-8">
              {tLanding('heroSubtitle') || "Japan's Premier Booking Platform"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowAccessModal(true)}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-all text-lg"
              >
                {tLanding('heroLogin') || 'Login'}
              </button>
              <button
                onClick={() => setShowAccessModal(true)}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all text-lg"
              >
                {tLanding('heroJoin') || 'Join'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CATEGORY GRID */}
      <CategoryGrid />

      {/* SECTION 3 — HOW IT WORKS */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {tLanding('howItWorksTitle') || 'How It Works'}
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="flex-1 max-w-xs text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tLanding('step1Title') || 'Search by category or location'}
              </h3>
              <p className="text-gray-600">
                {tLanding('step1Desc') || 'Browse through our extensive list of categories and find the perfect service near you.'}
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-blue-600 text-4xl">→</div>

            {/* Step 2 */}
            <div className="flex-1 max-w-xs text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tLanding('step2Title') || 'Book instantly or chat with AI'}
              </h3>
              <p className="text-gray-600">
                {tLanding('step2Desc') || 'Make a booking in seconds or use our AI assistant to help you find the best option.'}
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-blue-600 text-4xl">→</div>

            {/* Step 3 */}
            <div className="flex-1 max-w-xs text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tLanding('step3Title') || 'Get confirmation instantly'}
              </h3>
              <p className="text-gray-600">
                {tLanding('step3Desc') || 'Receive instant confirmation and manage your bookings all in one place.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — FOOTER */}
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
                  // Trigger owner login modal via event (existing system)
                  window.dispatchEvent(new CustomEvent('openLoginModal'));
                }}
                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                {tAuth('ownerLogin') || 'Owner Login'}
              </button>
              <button
                onClick={() => {
                  setShowAccessModal(false);
                  // Trigger owner signup modal via event (existing system)
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
