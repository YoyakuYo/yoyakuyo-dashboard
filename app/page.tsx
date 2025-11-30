// apps/dashboard/app/page.tsx
// Commercial Marketing Landing Page - No shop browsing (moved to customer dashboard)

"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { authApi } from '@/lib/api';
import { LandingHeader } from './components/LandingHeader';
import CommercialHero from './components/landing/CommercialHero';
import CommercialBlocks from './components/landing/CommercialBlocks';
import CategoryBanners from './components/landing/CategoryBanners';
import CTABlocks from './components/landing/CTABlocks';

// Force dynamic rendering to avoid prerendering errors
export const dynamic = 'force-dynamic';

// Modal component
const Modal = React.memo(({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
      onClick={onClose}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

function HomeContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  let t: ReturnType<typeof useTranslations>;
  let tAuth: ReturnType<typeof useTranslations>;
  let tLanding: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations('home');
    tAuth = useTranslations('auth');
    tLanding = useTranslations('landing');
  } catch (error) {
    console.warn("🔥 useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tLanding = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupShopName, setSignupShopName] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true);
    };
    const handleOpenSignupModal = () => {
      setShowSignupModal(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('openLoginModal', handleOpenLoginModal);
      window.addEventListener('openSignupModal', handleOpenSignupModal);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openLoginModal', handleOpenLoginModal);
        window.removeEventListener('openSignupModal', handleOpenSignupModal);
      }
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/owner/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const supabase = getSupabaseClient();
      let authData: any = null;
      let signInError: any = null;

      try {
        const result = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        authData = result.data;
        signInError = result.error;
      } catch (directError: any) {
        const isCorsError = directError?.message?.includes('CORS') || 
                           directError?.message?.includes('Failed to fetch') ||
                           directError?.name === 'TypeError';
        
        if (isCorsError) {
          try {
            const backendResponse = await authApi.login(loginEmail, loginPassword);
            
            if (backendResponse.success && backendResponse.session) {
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: backendResponse.session.access_token,
                refresh_token: backendResponse.session.refresh_token,
              });

              if (setSessionError) {
                setLoginError(setSessionError.message || 'Failed to set session');
                setLoginLoading(false);
                return;
              }

              const { data: { user } } = await supabase.auth.getUser();
              authData = { user, session: backendResponse.session };
              signInError = null;
            } else {
              signInError = { message: backendResponse.error || 'Login failed' };
            }
          } catch (backendError: any) {
            signInError = { message: backendError.message || 'Login failed' };
          }
        } else {
          signInError = directError;
        }
      }

      if (signInError) {
        setLoginError(signInError.message || 'Invalid login credentials');
        setLoginLoading(false);
        return;
      }

      if (!authData?.user) {
        setLoginError('Login failed: No user data returned');
        setLoginLoading(false);
        return;
      }

      try {
        await authApi.syncUser(
          authData.user.id,
          authData.user.email || loginEmail,
          authData.user.user_metadata?.name
        );
      } catch (syncError) {
        console.warn('Failed to sync user to users (non-blocking):', syncError);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (!verifySession && authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setShowLoginModal(false);
      setTimeout(() => {
        router.push('/owner/dashboard');
        router.refresh();
      }, 300);
    } catch (err) {
      console.error('Login error:', err);
      const authError = err as AuthError;
      setLoginError(authError.message || 'An unexpected error occurred during login');
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSignupError(null);
    setSignupLoading(true);

    try {
      if (!signupName || !signupEmail || !signupPassword) {
        setSignupError(t('auth.fillRequiredFields'));
        setSignupLoading(false);
        return;
      }

      const supabase = getSupabaseClient();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
          },
        },
      });

      if (signUpError) {
        setSignupError(signUpError.message);
        setSignupLoading(false);
        return;
      }

      if (!authData.user) {
        setSignupError('Failed to create user account');
        setSignupLoading(false);
        return;
      }

      const userId = authData.user.id;

      const setupRes = await fetch(`${apiUrl}/auth/signup-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name: signupName,
          email: signupEmail,
          shop_name: signupShopName || null,
        }),
      });

      if (!setupRes.ok) {
        const errorData = await setupRes.json().catch(() => ({ error: 'Failed to setup account' }));
        setSignupError(errorData.error || t('auth.failedToSetupAccount'));
        setSignupLoading(false);
        return;
      }

      const setupData = await setupRes.json();
      let session = authData.session;
      
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
      }
      
      if (!session) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        });

        if (signInError) {
          setSignupError(`Account created successfully! Please sign in manually with your email and password. If you received a confirmation email, please confirm it first.`);
          setSignupLoading(false);
          setShowSignupModal(false);
          setTimeout(() => {
            setShowLoginModal(true);
          }, 500);
          return;
        }
        
        session = signInData.session;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setShowSignupModal(false);
      router.push('/owner/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      const errorMessage = err instanceof Error ? err.message : t('auth.unexpectedError');
      setSignupError(errorMessage);
      setSignupLoading(false);
    }
  };

  const handleCloseLoginModal = useCallback(() => setShowLoginModal(false), []);
  const handleCloseSignupModal = useCallback(() => setShowSignupModal(false), []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Only Language Selector */}
      <LandingHeader 
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenSignup={() => setShowSignupModal(true)}
      />

      {/* Hero Section - Clean, Minimal */}
      <CommercialHero />

      {/* Commercial Blocks */}
      <CommercialBlocks />

      {/* Category Banners - Stacked Full-Width */}
      <CategoryBanners />

      {/* CTA Blocks */}
      <CTABlocks />

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            {tLanding('howItWorksTitle')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* For Customers Card */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {tLanding('forCustomersTitle')}
              </h3>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-1">✓</span>
                  <span>{tLanding('forCustomersBullet1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-1">✓</span>
                  <span>{tLanding('forCustomersBullet2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600 mt-1">✓</span>
                  <span>{tLanding('forCustomersBullet3')}</span>
                </li>
              </ul>
            </div>

            {/* For Owners Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {tLanding('forOwnersTitle')}
              </h3>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('forOwnersBullet1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('forOwnersBullet2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>{tLanding('forOwnersBullet3')}</span>
                </li>
              </ul>
            </div>

            {/* AI Assistance Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {tLanding('aiAssistanceTitle')}
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>{tLanding('aiAssistanceBullet1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>{tLanding('aiAssistanceBullet2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>{tLanding('aiAssistanceBullet3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={handleCloseLoginModal}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('auth.signInToShop')}
        </h2>

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.email')}
            </label>
            <input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loginLoading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <button
            onClick={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('joinAsOwner')}
          </button>
        </p>
      </Modal>

      {/* Signup Modal */}
      <Modal isOpen={showSignupModal} onClose={handleCloseSignupModal}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {tAuth('createOwnerAccount')}
        </h2>

        {signupError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {signupError}
          </div>
        )}

        <form 
          onSubmit={handleSignupSubmit} 
          className="space-y-4"
          noValidate
        >
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
              {tAuth('ownerName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={tAuth('ownerName')}
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              {tAuth('password')} <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-password"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="signup-shop-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('myShop.shopName')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
            </label>
            <input
              id="signup-shop-name"
              type="text"
              value={signupShopName}
              onChange={(e) => setSignupShopName(e.target.value)}
              autoComplete="organization"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('myShop.shopName')}
            />
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signupLoading ? tAuth('creatingAccount') : tAuth('signUp')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {tAuth('alreadyHaveAccount')}{' '}
          <button
            onClick={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {tAuth('signIn')}
          </button>
        </p>
      </Modal>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
