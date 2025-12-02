// Yoyaku Yo - New Landing Page
"use client";

import React, { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import SimpleNavbar from './components/landing/SimpleNavbar';
import CategoryCard from './components/landing/CategoryCard';
import OwnerModals from './components/OwnerModals';

export const dynamic = 'force-dynamic';

function HomeContent() {
  const locale = useLocale();
  const t = useTranslations('landing');

  // Category data for the 6 super-categories
  const categories = [
    {
      id: 'beauty_services',
      name: 'Beauty Services',
      nameJa: '美容サービス',
      description: 'Professional beauty and grooming services across Japan',
      sellingPoints: [
        'Popular services across Japan',
        'Trusted local salons',
        'Clear pricing and availability',
        'Easy online booking',
      ],
      subcategories: ['Hair Salon', 'Nail Salon', 'Eyelashes & Eyebrows', 'Barber Shop'],
      imageSearchTerms: [
        'japanese modern hair salon',
        'tokyo beauty salon interior',
        'japanese nail salon',
        'japanese barber shop',
        'japanese eyelash extension',
        'modern japanese beauty salon',
      ],
    },
    {
      id: 'spa_onsen',
      name: 'Spa, Onsen & Relaxation',
      nameJa: 'スパ・温泉・リラクゼーション',
      description: 'Traditional Japanese relaxation and wellness experiences',
      sellingPoints: [
        'Traditional Japanese relaxation',
        'Private & public onsen options',
        'Spa treatments and body care',
        'Ideal for rest and recovery',
      ],
      subcategories: ['Spa & Massages', 'Onsen & Ryokan'],
      imageSearchTerms: [
        'japanese onsen outdoor',
        'luxury japanese spa massage',
        'traditional japanese ryokan room',
        'japanese hot spring mountain',
        'japanese relaxation spa room',
        'tokyo spa treatment room',
      ],
    },
    {
      id: 'hotels',
      name: 'Hotels & Stays',
      nameJa: 'ホテル・宿泊',
      description: 'Convenient accommodation options throughout Japan',
      sellingPoints: [
        'Convenient accommodation across Japan',
        'Easy booking for travelers',
        'Secure instant reservations',
        'Wide range of room types',
      ],
      subcategories: ['Hotel', 'Boutique', 'Business Hotels'],
      imageSearchTerms: [
        'japanese modern hotel lobby',
        'tokyo hotel room interior',
        'japanese boutique hotel',
        'japanese business hotel',
        'modern japanese hotel design',
        'japanese hotel room view',
      ],
    },
    {
      id: 'dining',
      name: 'Dining & Nightlife',
      nameJa: '飲食・ナイトライフ',
      description: 'Authentic Japanese dining and nightlife experiences',
      sellingPoints: [
        'Authentic dining experiences',
        'Reserve tables instantly',
        'Popular local spots',
        'Clear menu and availability',
      ],
      subcategories: ['Restaurant', 'Izakaya'],
      imageSearchTerms: [
        'tokyo fine dining restaurant',
        'japanese restaurant interior modern',
        'japanese izakaya bar',
        'tokyo nightlife restaurant',
        'japanese traditional restaurant',
        'modern japanese dining',
      ],
    },
    {
      id: 'clinics',
      name: 'Clinics & Medical Care',
      nameJa: 'クリニック・医療サービス',
      description: 'Licensed medical and aesthetic services',
      sellingPoints: [
        'Licensed and verified clinics',
        'Nationwide medical services',
        'Clean, modern facilities',
        'Simple appointment booking',
      ],
      subcategories: ['Aesthetic Clinic', 'Dental Clinic', "Women's Clinic"],
      imageSearchTerms: [
        'japanese modern clinic interior',
        'tokyo medical clinic',
        'japanese aesthetic clinic',
        'japanese dental clinic',
        'modern japanese healthcare',
        'japanese medical facility',
      ],
    },
    {
      id: 'activities',
      name: 'Activities & Sports',
      nameJa: 'アクティビティ・スポーツ',
      description: 'Sports and recreational activities across Japan',
      sellingPoints: [
        'Sports and activity options across Japan',
        'Indoor and outdoor facilities',
        'Instant session booking',
        'Beginner-friendly',
      ],
      subcategories: ['Golf Practice Ranges'],
      imageSearchTerms: [
        'japanese golf practice range',
        'tokyo sports facility',
        'japanese indoor sports',
        'japanese recreational activity',
        'modern japanese sports center',
        'japanese activity center',
      ],
    },
  ];

  const handleOwnerSignup = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSignupModal'));
    }
  };

  const handleCustomerSignup = () => {
    // Navigate to customer signup page
    window.location.href = '/customer-signup';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <SimpleNavbar />

      {/* 1. TOP — APP FEATURES */}
      <section className="bg-gray-50 py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">24/7 AI Booking</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Multilingual: Japanese, English, Spanish, Portuguese, Chinese
              </h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Payments (Stripe)</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES OVERVIEW */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl">💇</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Beauty</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl">♨️</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Spa & Onsen</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl">🏨</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Hotels</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl">🍱</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Dining</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl">🏥</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Clinics</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-2">
                <span className="text-3xl">⛳</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Activities</p>
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm md:text-base">
            Browse shops, clinics, restaurants, spas, hotels and more across Japan.
          </p>
        </div>
      </section>

      {/* 3. MAIN SECTION — 6 ULTRA BIG CATEGORY CARDS */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: 2 cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <CategoryCard
              categoryName={categories[0].name}
              categoryNameJa={categories[0].nameJa}
              description={categories[0].description}
              sellingPoints={categories[0].sellingPoints}
              subcategories={categories[0].subcategories}
              imageSearchTerms={categories[0].imageSearchTerms}
              categoryId={categories[0].id}
            />
            <CategoryCard
              categoryName={categories[1].name}
              categoryNameJa={categories[1].nameJa}
              description={categories[1].description}
              sellingPoints={categories[1].sellingPoints}
              subcategories={categories[1].subcategories}
              imageSearchTerms={categories[1].imageSearchTerms}
              categoryId={categories[1].id}
            />
          </div>

          {/* Row 2: 2 cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <CategoryCard
              categoryName={categories[2].name}
              categoryNameJa={categories[2].nameJa}
              description={categories[2].description}
              sellingPoints={categories[2].sellingPoints}
              subcategories={categories[2].subcategories}
              imageSearchTerms={categories[2].imageSearchTerms}
              categoryId={categories[2].id}
            />
            <CategoryCard
              categoryName={categories[3].name}
              categoryNameJa={categories[3].nameJa}
              description={categories[3].description}
              sellingPoints={categories[3].sellingPoints}
              subcategories={categories[3].subcategories}
              imageSearchTerms={categories[3].imageSearchTerms}
              categoryId={categories[3].id}
            />
          </div>

          {/* Row 3: 2 cards (slightly smaller) */}
          <div className="grid md:grid-cols-2 gap-6">
            <CategoryCard
              categoryName={categories[4].name}
              categoryNameJa={categories[4].nameJa}
              description={categories[4].description}
              sellingPoints={categories[4].sellingPoints}
              subcategories={categories[4].subcategories}
              imageSearchTerms={categories[4].imageSearchTerms}
              categoryId={categories[4].id}
            />
            <CategoryCard
              categoryName={categories[5].name}
              categoryNameJa={categories[5].nameJa}
              description={categories[5].description}
              sellingPoints={categories[5].sellingPoints}
              subcategories={categories[5].subcategories}
              imageSearchTerms={categories[5].imageSearchTerms}
              categoryId={categories[5].id}
            />
          </div>
        </div>
      </section>

      {/* 4. CUSTOMER SECTION */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            For Customers (お客様向け)
          </h2>

          <div className="bg-gray-50 rounded-xl p-6 md:p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No account required</h3>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>Book using AI without signing up</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>AI checks availability and answers questions 24/7</span>
              </li>
            </ul>
          </div>

          <div className="bg-pink-50 rounded-xl p-6 md:p-8 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Create a free account for more features
            </h3>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>Save favorites</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>View past & upcoming bookings</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>Send & receive messages with shops</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>Receive notifications & reminders</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>Write reviews</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700">
                <span className="text-pink-600 mt-1">✓</span>
                <span>AI assistance in 5 languages (JA, EN, ES, PT, CN)</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={handleCustomerSignup}
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Create Free Account (Optional)
            </button>
          </div>
        </div>
      </section>

      {/* 5. OWNER SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            For Shop Owners（オーナー様向け）
          </h2>

          <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>Claim your shop page for free</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>Accept online bookings 24/7</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>Add services, pricing, and working hours</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>Manage reservations easily</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>AI assistant in 5 languages</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>Increased visibility to locals & tourists</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>One-month free trial</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-pink-600 mt-1 text-xl">✓</span>
                <span>Continue only if you like the service</span>
              </li>
            </ul>

            <div className="text-center">
              <button
                onClick={handleOwnerSignup}
                className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Claim My Shop (Free Trial)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLEAN FOOTER */}
      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
              <Link href="/about" className="hover:text-pink-400 transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-pink-400 transition-colors">
                Contact
              </Link>
              <Link href="/terms" className="hover:text-pink-400 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-pink-400 transition-colors">
                Privacy
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} Yoyaku Yo
            </div>
          </div>
        </div>
      </footer>

      <OwnerModals />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
