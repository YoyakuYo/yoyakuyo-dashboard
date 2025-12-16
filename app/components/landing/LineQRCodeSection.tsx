"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

export default function LineQRCodeSection() {
  const t = useTranslations();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [lineUrl, setLineUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // STEP 2: QR CODE ROLE - Onboarding ONLY
    // QR code should force add-friend first, then redirect to LIFF
    // This follows LINE's intended persistence model
    
    const lineOfficialAccountId = process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    
    if (!lineOfficialAccountId && !liffId) {
      console.warn("NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_ID or NEXT_PUBLIC_LIFF_ID is not set. QR code will not work.");
      setLoading(false);
      return;
    }
    
    // QR code points to LINE Official Account add-friend URL
    // Format: https://line.me/R/ti/p/@ACCOUNT_ID
    // After adding friend, user will be redirected to LIFF via welcome message or rich menu
    let qrUrl: string;
    
    if (lineOfficialAccountId) {
      // Use Official Account add-friend URL (preferred)
      // This forces add-friend before accessing LIFF
      qrUrl = `https://line.me/R/ti/p/@${lineOfficialAccountId.replace('@', '')}`;
    } else if (liffId) {
      // Fallback: Direct LIFF URL (not ideal, but works)
      // Note: This bypasses add-friend requirement
      qrUrl = `https://liff.line.me/${liffId}?entry=qr`;
    } else {
      setLoading(false);
      return;
    }

    setLineUrl(qrUrl);

    // Generate QR code using QR Server API
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
    setQrCodeUrl(qrCodeImageUrl);
    setLoading(false);
  }, []);

  const handleCopyLink = () => {
    if (lineUrl) {
      navigator.clipboard.writeText(lineUrl);
      alert(t('line.lineLinkCopied') || 'LINE link copied to clipboard!');
    }
  };

  if (loading) {
    return null;
  }

  return (
    <section className="relative py-12 md:py-16 bg-gradient-to-br from-green-500 via-green-600 to-blue-600 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12 border border-white/20">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
                <span className="text-lg">📱</span>
                <span>{t('landing.lineBadge') || 'LINE Official Account'}</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
                {t('landing.lineTitle') || 'Book via LINE'}
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                {t('landing.lineDescription') || 'Add our LINE bot and book appointments directly from LINE! Search shops, make bookings, and get instant confirmations.'}
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-green-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="text-lg text-gray-800 font-medium">{t('landing.lineFeature1') || 'Search shops by category and location'}</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-green-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="text-lg text-gray-800 font-medium">{t('landing.lineFeature2') || 'Book appointments with AI assistant'}</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-green-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="text-lg text-gray-800 font-medium">{t('landing.lineFeature3') || 'Get booking confirmations instantly'}</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-green-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="text-lg text-gray-800 font-medium">{t('landing.lineFeature4') || 'View and manage your bookings'}</span>
                </li>
              </ul>
              
              {lineUrl && (
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <span>🔗</span>
                  <span>{t('landing.copyLineLink') || 'Copy LINE Link'}</span>
                </button>
              )}
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center order-1 md:order-2">
              {qrCodeUrl ? (
                <>
                  <div className="relative bg-white p-6 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
                    <img
                      src={qrCodeUrl}
                      alt={t('landing.lineQRCode') || 'LINE QR Code'}
                      className="w-72 h-72 md:w-80 md:h-80"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-bold text-white mb-2">
                      {t('landing.scanToAddLine') || 'LINE QR Code'}
                    </p>
                    <p className="text-base text-white/90 font-medium">
                      {t('landing.scanInstructions') || 'Scan to add LINE bot'}
                    </p>
                    <p className="text-sm text-white/80 mt-2">
                      {t('landing.scanSubtext') || 'Open LINE app and scan this QR code'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-72 h-72 md:w-80 md:h-80 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white font-medium">{t('landing.loadingQR') || 'Loading QR code...'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

