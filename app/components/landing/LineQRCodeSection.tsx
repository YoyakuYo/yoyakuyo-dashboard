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
    // Generate QR code for LIFF app (booking platform)
    // This opens the booking platform directly in LINE app, not the chat
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    
    if (!liffId) {
      console.warn("NEXT_PUBLIC_LIFF_ID is not set. QR code will not work.");
      setLoading(false);
      return;
    }
    
    // LIFF URL format: https://liff.line.me/LIFF_ID/liff
    // Use /liff entry route which forces LINE client
    // Remove empty shop_id parameter - just go to main app
    const liffUrl = `https://liff.line.me/${liffId}/liff`;

    setLineUrl(liffUrl);

    // Generate QR code using QR Server API
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(liffUrl)}`;
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
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('landing.lineTitle') || 'Book via LINE'}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('landing.lineDescription') || 'Scan the QR code to open our booking platform directly in LINE! Search shops, make bookings, and get instant confirmations.'}
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <span className="text-gray-700">{t('landing.lineFeature1') || 'Search shops by category and location'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <span className="text-gray-700">{t('landing.lineFeature2') || 'Book appointments with AI assistant'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <span className="text-gray-700">{t('landing.lineFeature3') || 'Get booking confirmations instantly'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl mt-1">✓</span>
                  <span className="text-gray-700">{t('landing.lineFeature4') || 'View and manage your bookings'}</span>
                </li>
              </ul>
              {lineUrl && (
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  {t('landing.copyLineLink') || 'Copy LINE Link'}
                </button>
              )}
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center">
              {qrCodeUrl ? (
                <>
                  <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                    <img
                      src={qrCodeUrl}
                      alt={t('landing.lineQRCode') || 'LINE QR Code'}
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-center text-gray-600 mb-2 font-medium">
                    {t('landing.scanToAddLine') || 'Scan to open booking platform'}
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    {t('landing.scanInstructions') || 'Open LINE app and scan this QR code to access the booking platform'}
                  </p>
                </>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500">{t('landing.loadingQR') || 'Loading QR code...'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

