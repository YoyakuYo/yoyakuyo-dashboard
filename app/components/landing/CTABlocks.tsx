// app/components/landing/CTABlocks.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function CTABlocks() {
  const t = useTranslations('home');

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* For Customers */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all text-center">
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('customerCTATitle')}
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              {t('customerCTADesc')}
            </p>
            <Link
              href="/customer-signup"
              className="inline-block px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
            >
              {t('joinAsCustomer')}
            </Link>
          </div>

          {/* For Owners */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-10 shadow-xl hover:shadow-2xl transition-all text-center">
            <div className="text-6xl mb-6">💼</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('ownerCTATitle')}
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              {t('ownerCTADesc')}
            </p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openSignupModal'));
              }}
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
            >
              {t('joinAsOwner')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

