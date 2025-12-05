"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import ReviewCard from '../ReviewCard';
import ReviewStats from '../ReviewStats';
import Link from 'next/link';

interface Review {
  id: string;
  shop_id: string;
  rating: number;
  comment?: string;
  customer_name?: string;
  created_at: string;
  shops?: {
    id: string;
    name: string;
  };
}

export default function ReviewsSection() {
  const t = useTranslations();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setLoading(true);
        // Fetch recent reviews from multiple shops
        // Since we don't have a global reviews endpoint, we'll fetch from a few popular shops
        // For now, we'll show a message that reviews are available on shop pages
        setReviews([]);
        setStats({
          averageRating: null,
          totalReviews: 0,
        });
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReviews();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('reviews.title') === 'reviews.title' ? 'Customer Reviews' : t('reviews.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('reviews.description') === 'reviews.description' ? 'See what our customers are saying about their experiences' : t('reviews.description')}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {t('reviews.noReviews') === 'reviews.noReviews' ? 'No reviews yet. Be the first to review a shop!' : t('reviews.noReviews')}
            </p>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('reviews.browseShops') === 'reviews.browseShops' ? 'Browse Shops' : t('reviews.browseShops')}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/browse"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('reviews.viewAllShops') === 'reviews.viewAllShops' ? 'View All Shops & Reviews' : t('reviews.viewAllShops')}
          </Link>
        </div>
      </div>
    </section>
  );
}


