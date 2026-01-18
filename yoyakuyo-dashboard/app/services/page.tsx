// apps/dashboard/app/services/page.tsx
// Comprehensive Services Page with Marketing for Customers and Owners

"use client";

import React, { Suspense, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import OwnerModals from '../components/OwnerModals';

export const dynamic = 'force-dynamic';

function ServicesPageContent() {
  let t: ReturnType<typeof useTranslations>;
  let tService: ReturnType<typeof useTranslations>;
  const locale = useLocale();
  const isJapanese = locale === 'ja';
  const [activeTab, setActiveTab] = useState<'customers' | 'owners'>('customers');
  
  try {
    t = useTranslations();
    tService = useTranslations('service');
  } catch {
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tService = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)'
          }}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className={`text-4xl md:text-6xl font-bold text-white mb-6 ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese ? 'Yoyaku Yoのサービス' : 'Everything You Need to Book & Grow'}
          </h1>
          <p className={`text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
            {isJapanese 
              ? '日本で最も包括的な予約プラットフォーム。お客様も店舗オーナーも、すべてのニーズに対応します。'
              : 'Japan\'s most comprehensive booking platform. Built for customers and shop owners alike.'}
          </p>
          
          {/* Tab Switcher */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                activeTab === 'customers'
                  ? 'bg-white text-blue-600 shadow-xl scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isJapanese ? 'お客様向け' : 'For Customers'}
            </button>
            <button
              onClick={() => setActiveTab('owners')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                activeTab === 'owners'
                  ? 'bg-white text-blue-600 shadow-xl scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isJapanese ? 'オーナー向け' : 'For Owners'}
            </button>
          </div>
        </div>
      </section>

      {/* CUSTOMERS SECTION */}
      {activeTab === 'customers' && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'お客様のための機能' : 'Everything Customers Need'}
              </h2>
              <p className={`text-lg text-gray-600 max-w-2xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese 
                  ? '簡単、迅速、そして楽しい予約体験'
                  : 'Simple, fast, and delightful booking experience'}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Easy Online Booking */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '簡単オンライン予約' : 'Easy Online Booking'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese
                    ? 'シンプルで使いやすい予約システムで、いつでも簡単に予約できます。'
                    : 'Simple and user-friendly booking system. Book anytime with ease.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '多言語対応（日本語、英語、中国語、スペイン語、ポルトガル語）' : 'Multi-language support (5 languages)'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '即座の予約確認' : 'Instant booking confirmation'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? 'カスタマイズ可能な予約' : 'Customizable bookings'}</span>
                  </li>
                </ul>
              </div>

              {/* Search & Discovery */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '検索と発見' : 'Search & Discovery'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '47都道府県、15以上のカテゴリーから最適な店舗を見つけましょう。'
                    : 'Find the perfect shop from 47 prefectures and 15+ categories.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? 'カテゴリー別検索' : 'Search by category'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? '地域・都道府県フィルター' : 'Region & prefecture filters'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? 'リアルタイム空き状況' : 'Real-time availability'}</span>
                  </li>
                </ul>
              </div>

              {/* Customer Dashboard */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 border-2 border-teal-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? 'マイダッシュボード' : 'My Dashboard'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? 'すべての予約、お気に入りの店舗、メッセージを一箇所で管理。'
                    : 'Manage all bookings, favorite shops, and messages in one place.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{isJapanese ? '予約履歴の管理' : 'Booking history management'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{isJapanese ? 'お気に入り店舗の保存' : 'Save favorite shops'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{isJapanese ? '簡単な予約変更・キャンセル' : 'Easy reschedule & cancel'}</span>
                  </li>
                </ul>
              </div>

              {/* Reviews & Ratings */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 border-2 border-yellow-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-yellow-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? 'レビューと評価' : 'Reviews & Ratings'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '実際の予約からレビューを投稿し、他のお客様のレビューを参考にしましょう。'
                    : 'Leave reviews from real bookings and read authentic customer feedback.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{isJapanese ? '確認済みレビュー' : 'Verified reviews only'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{isJapanese ? '写真付きレビュー' : 'Photo reviews'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{isJapanese ? '信頼できる評価システム' : 'Trustworthy rating system'}</span>
                  </li>
                </ul>
              </div>

              {/* Notifications */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-8 border-2 border-pink-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? 'リアルタイム通知' : 'Real-Time Notifications'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '予約確認、変更、リマインダーをリアルタイムで受け取ります。'
                    : 'Get instant notifications for confirmations, changes, and reminders.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 mt-1">✓</span>
                    <span>{isJapanese ? '予約確認通知' : 'Booking confirmations'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 mt-1">✓</span>
                    <span>{isJapanese ? 'ステータス変更通知' : 'Status change alerts'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 mt-1">✓</span>
                    <span>{isJapanese ? 'リマインダー' : 'Reminders'}</span>
                  </li>
                </ul>
              </div>

              {/* Secure & Safe */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border-2 border-green-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '安全で安心' : 'Secure & Safe'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? 'SSL暗号化とプライバシー保護で、あなたの情報を守ります。'
                    : 'SSL encryption and privacy protection help keep your data safe.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{isJapanese ? 'SSL暗号化' : 'SSL encryption'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{isJapanese ? 'プライバシー保護' : 'Privacy protection'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{isJapanese ? '安全なアカウント管理' : 'Secure account access'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
              <h3 className={`text-3xl md:text-4xl font-bold mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '今すぐ始めましょう！' : 'Ready to Get Started?'}
              </h3>
              <p className={`text-xl mb-8 text-white/90 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese 
                  ? 'アカウントを作成して、日本中の素晴らしい店舗を発見しましょう。'
                  : 'Create an account and discover amazing shops across Japan.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openLoginJoinModal', { detail: { mode: 'join' } }));
                  }}
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  {isJapanese ? '登録する' : 'Sign Up'}
                </button>
                <Link
                  href="/categories"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all text-lg"
                >
                  {isJapanese ? 'カテゴリーを見る' : 'Browse Categories'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OWNERS SECTION */}
      {activeTab === 'owners' && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? '店舗オーナーのための機能' : 'Everything Owners Need'}
              </h2>
              <p className={`text-lg text-gray-600 max-w-2xl mx-auto ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese 
                  ? 'ビジネスを成長させ、顧客を満足させるための強力なツール'
                  : 'Powerful tools to grow your business and delight customers'}
              </p>
            </div>

            {/* Why Join Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 mb-12 text-white">
              <h3 className={`text-3xl md:text-4xl font-bold mb-6 text-center ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'なぜYoyaku Yoを選ぶのか？' : 'Why Join Yoyaku Yo?'}
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-lg font-semibold mb-2 ${isJapanese ? 'font-japanese' : ''}`}>
                    {isJapanese ? '日本全国の店舗' : 'Thousands of shops across Japan'}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold mb-2 ${isJapanese ? 'font-japanese' : ''}`}>
                    {isJapanese ? '忙しい予約管理に対応' : 'Built for busy schedules'}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold mb-2 ${isJapanese ? 'font-japanese' : ''}`}>
                    {isJapanese ? '品質重視の予約体験' : 'Quality-focused booking experience'}
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Customer Communication */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '顧客コミュニケーション' : 'Customer Communication'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese
                    ? '顧客との円滑なコミュニケーションをサポート。メッセージの管理と対応が簡単になります。'
                    : 'Support smooth communication with customers. Easily manage messages and responses.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '多言語自動対応' : 'Multi-language auto-response'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '予約の自動確認' : 'Auto booking confirmation'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '手動介入の削減' : 'Reduce manual work'}</span>
                  </li>
                </ul>
              </div>

              {/* Booking Management */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '予約管理' : 'Booking Management'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? 'すべての予約を一箇所で管理。カレンダービュー、フィルター、検索機能付き。'
                    : 'Manage all bookings in one place. Calendar view, filters, and search included.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? 'カレンダービュー' : 'Calendar view'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? 'リアルタイム更新' : 'Real-time updates'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? '予約ステータス管理' : 'Status management'}</span>
                  </li>
                </ul>
              </div>

              {/* Shop Pages */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 border-2 border-teal-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '美しい店舗ページ' : 'Beautiful Shop Pages'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '写真、サービス、スタッフ、営業時間を表示するカスタマイズ可能な店舗ページ。'
                    : 'Customizable shop pages with photos, services, staff, and hours.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{isJapanese ? 'カスタマイズ可能なデザイン' : 'Customizable design'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{isJapanese ? '高品質な写真ギャラリー' : 'Photo gallery'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-1">✓</span>
                    <span>{isJapanese ? 'SEO最適化' : 'SEO optimized'}</span>
                  </li>
                </ul>
              </div>

              {/* Notifications (Owner) */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-8 border-2 border-pink-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? 'オーナー通知' : 'Owner Notifications'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '新着メッセージ、予約、変更などの重要な更新を受け取れます。'
                    : 'Get alerts for important updates like new messages, bookings, and changes.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 mt-1">✓</span>
                    <span>{isJapanese ? '新着顧客メッセージ' : 'New customer messages'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 mt-1">✓</span>
                    <span>{isJapanese ? '新規予約の通知' : 'New booking alerts'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 mt-1">✓</span>
                    <span>{isJapanese ? '変更・キャンセルの更新' : 'Updates for changes & cancellations'}</span>
                  </li>
                </ul>
              </div>

              {/* Analytics */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border-2 border-orange-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? 'インサイトとレポート' : 'Insights & Reports'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '予約と顧客の傾向を分析して、運用を最適化。'
                    : 'Optimize operations with analytics on bookings and customer trends.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{isJapanese ? '予約統計' : 'Booking statistics'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{isJapanese ? 'パフォーマンスレポート' : 'Performance reports'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>{isJapanese ? '顧客インサイト' : 'Customer insights'}</span>
                  </li>
                </ul>
              </div>

              {/* Reviews Management */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 border-2 border-yellow-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="w-16 h-16 bg-yellow-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold text-gray-900 mb-3 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? 'レビュー管理' : 'Review Management'}
                </h3>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '顧客レビューを管理し、返信して、信頼を構築しましょう。'
                    : 'Manage customer reviews, respond to feedback, and build trust.'}
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{isJapanese ? 'レビューへの返信' : 'Respond to reviews'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{isJapanese ? '評価統計の追跡' : 'Track rating stats'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">✓</span>
                    <span>{isJapanese ? '信頼性の向上' : 'Build credibility'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Claim Your Shop CTA */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center text-white mb-12">
              <h3 className={`text-3xl md:text-4xl font-bold mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese ? 'あなたの店舗を登録しましょう！' : 'Claim Your Shop Today!'}
              </h3>
              <p className={`text-xl mb-8 text-white/90 ${isJapanese ? 'font-japanese' : ''}`}>
                {isJapanese 
                  ? '既存の店舗を登録するか、新しい店舗を作成して、予約管理を始めましょう。'
                  : 'Claim your existing shop or create a new one and start managing bookings.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openSignupModal'));
                  }}
                  className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  {isJapanese ? 'オーナー登録' : 'Join as Owner'}
                </button>
                <Link
                  href="/owner"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all text-lg"
                >
                  {isJapanese ? 'オーナーダッシュボードを見る' : 'View Owner Dashboard'}
                </Link>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h4 className={`text-2xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '既存店舗の登録' : 'Claim Existing Shop'}
                </h4>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? 'Yoyaku Yoに既にリストされている店舗をお持ちですか？簡単な認証プロセスで店舗を登録し、予約管理を開始できます。'
                    : 'Do you own a shop already listed on Yoyaku Yo? Claim it with a simple verification process and start managing bookings.'}
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '簡単な認証プロセス' : 'Simple verification'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '既存の店舗情報を引き継ぎ' : 'Inherit existing shop data'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{isJapanese ? '即座に予約管理開始' : 'Start managing immediately'}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h4 className={`text-2xl font-bold text-gray-900 mb-4 ${isJapanese ? 'font-japanese' : ''}`}>
                  {isJapanese ? '新しい店舗の作成' : 'Create New Shop'}
                </h4>
                <p className={`text-gray-700 mb-4 ${isJapanese ? 'font-japanese' : ''}`} style={isJapanese ? { lineHeight: '1.8' } : {}}>
                  {isJapanese 
                    ? '新しい店舗をYoyaku Yoに追加しましょう。美しい店舗ページを作成し、すぐに予約を受け始められます。'
                    : 'Add your new shop to Yoyaku Yo. Create a beautiful shop page and start accepting bookings right away.'}
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? 'カスタマイズ可能な店舗ページ' : 'Customizable shop page'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? '写真とサービスの追加' : 'Add photos & services'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✓</span>
                    <span>{isJapanese ? 'すぐに予約受付開始' : 'Start accepting bookings'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Owner Login/Signup Modals */}
      <OwnerModals />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <ServicesPageContent />
    </Suspense>
  );
}
