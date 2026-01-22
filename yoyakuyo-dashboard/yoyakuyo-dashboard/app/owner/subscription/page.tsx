"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive?: boolean;
  status: string;
  plan: string;
  shopId: string;
  shopName: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Shop {
  id: string;
  name: string;
}

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadShops();
      loadSubscriptionStatus();
    }
  }, [user, authLoading, router]);

  const loadShops = async () => {
    if (!user?.id) return;

    try {
      // Use the same API endpoint as the dashboard for consistency
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setShops(data.shops);
          setSelectedShopId(data.shops[0].id);
        }
      } else {
        console.error('Error loading shops:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const loadSubscriptionStatus = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${apiUrl}/subscriptions/status/${user.id}`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        if (data.shopId) {
          setSelectedShopId(data.shopId);
        }
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'basic' | 'premium') => {
    if (!user?.id || !selectedShopId) {
      alert(t('subscription.pleaseSelectShop'));
      return;
    }

    try {
      setSubscribing(true);
      const response = await fetch(`${apiUrl}/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          ownerUserId: user.id,
          shopId: selectedShopId,
          plan: plan,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let msg = 'Failed to create checkout session';
        try {
          const parsed = JSON.parse(text) as any;
          msg = parsed?.error || parsed?.message || msg;
        } catch {
          // If backend returns HTML/other text, show the first part
          msg = text?.slice(0, 200) || msg;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      alert(error.message || 'Failed to start subscription. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.id) return;

    try {
      setSubscribing(true);
      const response = await fetch(`${apiUrl}/subscriptions/create-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          ownerUserId: user.id,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let msg = 'Failed to create portal session';
        try {
          const parsed = JSON.parse(text) as any;
          msg = parsed?.error || parsed?.message || msg;
        } catch {
          msg = text?.slice(0, 200) || msg;
        }
        throw new Error(msg);
      }

      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Error creating portal:', error);
      alert(error.message || 'Failed to open subscription management. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'basic' as const,
      name: t('subscription.basicPlan'),
      tagline: t('subscription.basicTagline'),
      shopLimit: t('subscription.basicShopLimit'),
      price: '¥5,000',
      period: '/month',
      features: t.raw('subscription.basicPlanFeatures') as string[],
    },
    {
      id: 'premium' as const,
      name: t('subscription.premiumPlan'),
      tagline: t('subscription.premiumTagline'),
      shopLimit: t('subscription.premiumShopLimit'),
      price: '¥10,000',
      period: '/month',
      features: t.raw('subscription.premiumPlanFeatures') as string[],
      popular: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('subscription.title')}</h1>
        <p className="text-gray-600">{t('subscription.subtitle')}</p>
      </div>

      {/* Shop Selection */}
      {shops.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('subscription.selectShop')}
          </label>
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!!subscriptionStatus?.isActive}
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Subscription Status */}
      {subscriptionStatus?.hasSubscription && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">
                Current Subscription: {subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)} Plan
              </h3>
              <p className="text-sm text-blue-700">
                Status: <span className="font-medium capitalize">{subscriptionStatus.status}</span>
                {subscriptionStatus.currentPeriodEnd && (
                  <>
                    {' • '}
                    Renews: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                  </>
                )}
              </p>
              {subscriptionStatus.shopName && (
                <p className="text-sm text-blue-700 mt-1">
                  Shop: {subscriptionStatus.shopName}
                </p>
              )}
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={subscribing}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscribing ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      {!subscriptionStatus?.isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 bg-white rounded-lg shadow-sm border-2 ${
                plan.popular
                  ? 'border-blue-500 transform scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {t('subscription.mostPopular')}
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.tagline && (
                  <p className="text-sm text-gray-600 mb-3">{plan.tagline}</p>
                )}
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
                {plan.shopLimit && (
                  <div className="mt-3 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {plan.shopLimit}
                    </span>
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500 text-center mb-4">
                {t('subscription.billedMonthlyCancelAnytime')}
              </p>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing || !selectedShopId}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {subscribing ? t('subscription.processing') : t('subscription.subscribe')}
              </button>
            </div>
          ))}
        </div>
      )}

      {shops.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 mb-4">{t('subscription.needShop')}</p>
          <button
            onClick={() => router.push('/shops')}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('subscription.goToMyShop')}
          </button>
        </div>
      )}
    </div>
  );
}

