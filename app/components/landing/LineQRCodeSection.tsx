"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function LineQRCodeSection() {
  const tLanding = useTranslations('landing');
  const tLine = useTranslations('line');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [lineUrl, setLineUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tl = (key: string, fallback: string) => (tLanding.has(key) ? tLanding(key) : fallback);
  const tn = (key: string, fallback: string) => (tLine.has(key) ? tLine(key) : fallback);

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
      alert(tn('lineLinkCopied', 'LINE link copied to clipboard!'));
    }
  };

  if (loading) {
    return null;
  }

  return (
    <section className="relative py-4 md:py-6 bg-gradient-to-r from-green-500 to-blue-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-green-200">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Left: Content - Compact */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <span>📱</span>
                <span>{tl('lineBadge', 'LINE Official Account')}</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {tl('lineTitle', 'Book via LINE')}
              </h2>
              
              <p className="text-sm md:text-base text-gray-600 mb-3">
                {tl(
                  'lineDescription',
                  'Add our LINE bot and book appointments directly from LINE! Search shops, make bookings, and get instant confirmations.'
                )}
              </p>
              
              {/* Compact feature list - 2 columns on larger screens */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-xs md:text-sm text-gray-700">{tl('lineFeature1', 'Search shops by category and location')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-xs md:text-sm text-gray-700">{tl('lineFeature2', 'Book appointments directly from LINE')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-xs md:text-sm text-gray-700">{tl('lineFeature3', 'Get booking confirmations instantly')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-xs md:text-sm text-gray-700">{tl('lineFeature4', 'View and manage your bookings')}</span>
                </div>
              </div>
              
              {lineUrl && (
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <span>🔗</span>
                  <span>{tl('copyLineLink', 'Copy LINE Link')}</span>
                </button>
              )}
            </div>

            {/* Right: QR Code - Compact */}
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              {qrCodeUrl ? (
                <>
                  <div className="bg-white p-3 rounded-lg shadow-md mb-2">
                    <img
                      src={qrCodeUrl}
                      alt={tl('lineQRCode', 'LINE QR Code')}
                      className="w-32 h-32 md:w-40 md:h-40"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      {tl('scanToAddLine', 'Scan to add LINE bot')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {tl('scanInstructions', 'Open LINE app and scan this QR code')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tl('scanSubtext', 'If you are on desktop, open this page on your phone to scan.')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-xs">{tl('loadingQR', 'Loading...')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

