// apps/dashboard/app/page.tsx
// Clean White Public Landing Page

"use client";

import React, { useState, Suspense } from 'react';
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

        {/* Light Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              Yoyaku Yo
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 drop-shadow-md">
              Japan's Premier Booking Platform
            </p>
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
                Search the best salons, clinics & experiences in Japan
              </h3>
              <p className="text-gray-600 text-center">
                Discover thousands of verified businesses across 15+ categories — find exactly what you're looking for.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                AI-powered booking assistance
              </h3>
              <p className="text-gray-600 text-center">
                Our smart AI helps you instantly find availability, answer questions, and handle bookings in multiple languages — 24/7.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-5xl mb-4 text-center">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                Save time, book instantly
              </h3>
              <p className="text-gray-600 text-center">
                No more phone calls or waiting. Book your services in seconds and access your booking history anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — BROWSE BY CATEGORY GRID */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Browse by Category
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* SECTION 4 — FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold">
              Yoyaku Yo
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Yoyaku Yo. All rights reserved.
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Login
        </h2>
        <div className="space-y-4">
          <Link
            href="/customer-login"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            onClick={() => setShowLoginModal(false)}
          >
            Login as Customer
          </Link>
          <button
            onClick={() => {
              setShowLoginModal(false);
              window.dispatchEvent(new CustomEvent('openLoginModal'));
            }}
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
          >
            Login as Owner
          </button>
        </div>
      </Modal>

      {/* JOIN MODAL */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Join
        </h2>
        <div className="space-y-4">
          <Link
            href="/customer-signup"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            onClick={() => setShowJoinModal(false)}
          >
            Join as Customer
          </Link>
          <button
            onClick={() => {
              setShowJoinModal(false);
              window.dispatchEvent(new CustomEvent('openSignupModal'));
            }}
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
          >
            Join as Owner
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
