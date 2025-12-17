"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import ReviewForm from '../ReviewForm';
import Link from 'next/link';

interface Shop {
  id: string;
  name: string;
}

export default function ReviewsSection() {
  const t = useTranslations();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/shops?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setShops(data.shops || []);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const handleReviewSubmit = async (review: {
    shop_id: string;
    booking_id?: string | null;
    customer_id?: string | null;
    rating: number;
    comment?: string;
    photos?: string[];
  }) => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit review' }));
        throw new Error(errorData.error || 'Failed to submit review');
      }

      setSubmitted(true);
      setSelectedShopId('');
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
      throw err;
    }
  };

  if (submitted) {
    return (
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Thank you for your review!</h3>
            <p className="text-green-700">Your review has been submitted successfully.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('reviews.title') === 'reviews.title' ? 'Leave a Review' : t('reviews.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('reviews.description') === 'reviews.description' 
              ? 'Share your experience and help others discover great shops' 
              : t('reviews.description')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          {!selectedShopId ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a Shop *
              </label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading shops...</p>
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No shops available yet.</p>
                  <Link
                    href="/browse"
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Shops
                  </Link>
                </div>
              ) : (
                <>
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  >
                    <option value="">-- Select a shop --</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mb-4">
                    Can't find the shop? <Link href="/browse" className="text-blue-600 hover:underline">Browse all shops</Link>
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-600">Reviewing:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {shops.find(s => s.id === selectedShopId)?.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedShopId('')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Change shop
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <ReviewForm
                shopId={selectedShopId}
                onSubmit={handleReviewSubmit}
                onCancel={() => setSelectedShopId('')}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
