// app/components/landing/CommercialBlocks.tsx
"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function CommercialBlocks() {
  const t = useTranslations('home');

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('commercialBlock1Title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('commercialBlock1Text')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('commercialBlock2Title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('commercialBlock2Text')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('commercialBlock3Title')}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t('commercialBlock3Text')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

