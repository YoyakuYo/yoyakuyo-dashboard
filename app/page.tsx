// apps/dashboard/app/page.tsx
// Clean White/Blue Public Landing Page

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

        {/* Soft overlay gradient (dark at bottom, transparent top) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              {tLanding('heroTitle') || "Book beauty, wellness & hospitality across Japan"}
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 drop-shadow-md mb-8">
              {tLanding('heroSubtitle') || "Find salons, clinics, hotels and more — with AI helping you book in your language."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={scrollToCategories}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all text-lg"
              >
                {tLanding('browseCategories') || 'Browse Categories'}
              </button>
              <button
                onClick={scrollToHowItWorks}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-all text-lg border-2 border-blue-600"
              >
                {tLanding('howItWorks') || 'How it works'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — MARKETING BOXES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Box 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {tLanding('marketingCard1Title') || t('home.commercialBlock1Title') || 'Search the best salons, clinics & experiences in Japan'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('marketingCard1Text') || t('home.commercialBlock1Text') || 'Discover thousands of verified businesses across multiple categories and regions.'}
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {tLanding('marketingCard2Title') || t('home.commercialBlock2Title') || 'AI-powered booking assistance'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('marketingCard2Text') || t('home.commercialBlock2Text') || 'Our AI helps you find available times, answers questions, and handles bookings in multiple languages.'}
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {tLanding('marketingCard3Title') || t('home.commercialBlock3Title') || 'Save time, book instantly'}
              </h3>
              <p className="text-gray-600 text-center">
                {tLanding('marketingCard3Text') || t('home.commercialBlock3Text') || 'No more phone calls. Compare shops, save favorites, and manage bookings in one place.'}
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

      {/* SECTION 4 — HOW IT WORKS */}
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

      {/* SECTION 5 — FOOTER */}
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
