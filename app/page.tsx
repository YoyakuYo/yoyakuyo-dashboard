// apps/dashboard/app/page.tsx
// Redesigned landing page with hybrid beauty + tech design and multi-language support

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
import HeroCarousel from './components/landing/HeroCarousel';
import CategoryGrid from './components/landing/CategoryGrid';
import { BrowseAIAssistant } from './browse/components/BrowseAIAssistant';
import { BrowseAIProvider } from './components/BrowseAIContext';

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
  try {
    t = useTranslations();
  } catch (error) {
    console.warn("🔥 useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    if (typeof window !== 'undefined') {
      window.addEventListener('openLoginModal', handleOpenLoginModal);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openLoginModal', handleOpenLoginModal);
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

      // Try direct Supabase auth first (fastest, works if CORS is configured)
      try {
        const result = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        authData = result.data;
        signInError = result.error;
      } catch (directError: any) {
        // If CORS error or network error, fallback to backend
        const isCorsError = directError?.message?.includes('CORS') || 
                           directError?.message?.includes('Failed to fetch') ||
                           directError?.name === 'TypeError';
        
        if (isCorsError) {
          console.log('CORS error detected, using backend login route...');
          
          // Use backend login route (bypasses CORS)
          try {
            const backendResponse = await authApi.login(loginEmail, loginPassword);
            
            if (backendResponse.success && backendResponse.session) {
              // Set session in Supabase client
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: backendResponse.session.access_token,
                refresh_token: backendResponse.session.refresh_token,
              });

              if (setSessionError) {
                setLoginError(setSessionError.message || 'Failed to set session');
                setLoginLoading(false);
                return;
              }

              // Get user from session
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
          // Other error, use it directly
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

      // Verify session is stored
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error after login:', sessionError);
      }

      // Sync user to users table if missing
      try {
        await authApi.syncUser(
          authData.user.id,
          authData.user.email || loginEmail,
          authData.user.user_metadata?.name
        );
        console.log('User synced to users table');
      } catch (syncError) {
        // Log error but don't block login
        console.warn('Failed to sync user to users (non-blocking):', syncError);
      }

      // Ensure session is properly set and auth state is updated
      // Wait a moment for onAuthStateChange to fire and update the AuthProvider
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify session is set
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (!verifySession && authData.session) {
        console.warn('Session not found after login, but we have authData.session');
        // Session should be set by Supabase automatically, but if not, try to set it
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Close modal and redirect to owner dashboard
      setShowLoginModal(false);
      // Small delay to ensure auth state propagates, then redirect
      setTimeout(() => {
        router.push('/owner/dashboard');
        // Force a refresh of server components to pick up new auth state
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  const handleCloseLoginModal = useCallback(() => setShowLoginModal(false), []);
  const handleCloseSignupModal = useCallback(() => setShowSignupModal(false), []);

  return (
    <BrowseAIProvider>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <LandingHeader 
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenSignup={() => setShowSignupModal(true)}
        />

        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Category Grid */}
        <CategoryGrid />

      {/* Search & Quick Actions */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 rounded-theme focus:ring-2 focus:ring-accent-blue focus:border-accent-blue outline-none text-lg text-gray-900 placeholder-gray-400 font-body"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-accent-blue hover:bg-accent-blue/90 text-white font-heading font-semibold rounded-theme transition-colors"
              >
                {t('common.search')}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/browse?mode=category"
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-body font-medium rounded-theme border-2 border-gray-300 hover:border-accent-pink transition-all shadow-sm hover:shadow-md"
            >
              {t('home.browseByCategory')}
            </Link>
            <Link
              href="/browse?mode=area"
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-body font-medium rounded-theme border-2 border-gray-300 hover:border-accent-pink transition-all shadow-sm hover:shadow-md"
            >
              {t('home.browseByArea')}
            </Link>
            <Link
              href="/browse"
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-body font-medium rounded-theme border-2 border-gray-300 hover:border-accent-pink transition-all shadow-sm hover:shadow-md"
            >
              {t('home.nearbyServices')}
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-gray-900 mb-12">
            {t('home.howItWorks')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* For Customers Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-theme p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                {t('home.forCustomersTitle')}
              </h3>
              <ul className="space-y-3 text-gray-700 font-body">
                <li className="flex items-start gap-2">
                  <span className="text-accent-pink mt-1">✓</span>
                  <span>{t('home.forCustomersBullet1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-pink mt-1">✓</span>
                  <span>{t('home.forCustomersBullet2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-pink mt-1">✓</span>
                  <span>{t('home.forCustomersBullet3')}</span>
                </li>
              </ul>
            </div>

            {/* For Owners Card */}
            <div className="bg-card-bg border border-border-soft rounded-theme p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-2xl font-heading font-bold text-primary-text mb-4">
                {t('home.forOwnersTitle')}
              </h3>
              <ul className="space-y-3 text-gray-700 font-body">
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue mt-1">✓</span>
                  <span>{t('home.forOwnersBullet1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue mt-1">✓</span>
                  <span>{t('home.forOwnersBullet2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-blue mt-1">✓</span>
                  <span>{t('home.forOwnersBullet3')}</span>
                </li>
              </ul>
            </div>

            {/* AI Assistance Card */}
            <div className="bg-card-bg border border-border-soft rounded-theme p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-heading font-bold text-primary-text mb-4">
                {t('home.aiAssistanceTitle')}
              </h3>
              <ul className="space-y-3 text-gray-700 font-body">
                <li className="flex items-start gap-2">
                  <span className="text-accent-pink mt-1">✓</span>
                  <span>{t('home.aiAssistanceBullet1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-pink mt-1">✓</span>
                  <span>{t('home.aiAssistanceBullet2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-pink mt-1">✓</span>
                  <span>{t('home.aiAssistanceBullet3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Shop Owners */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
            {t('home.forOwnersTitle')}
          </h2>
          <p className="text-lg text-gray-700 font-body mb-8">
            {t('home.forOwnersDesc')}
          </p>
          <button
            onClick={() => setShowSignupModal(true)}
            className="px-8 py-4 bg-accent-blue hover:bg-accent-blue/90 text-white font-heading font-semibold rounded-theme transition-colors shadow-lg hover:shadow-xl"
          >
            {t('home.joinAsOwner')}
          </button>
        </div>
      </section>

      {/* AI Assistant Bubble - Must remain untouched */}
      <BrowseAIAssistant
        shops={[]}
        locale={typeof window !== 'undefined' ? (localStorage.getItem('yoyaku_yo_language') || 'en') : 'en'}
      />

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
            {t('home.joinAsOwner')}
          </button>
        </p>
      </Modal>

      {/* Signup Modal */}
      <Modal isOpen={showSignupModal} onClose={handleCloseSignupModal}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('auth.createOwnerAccount')}
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
              {t('auth.ownerName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('auth.ownerName')}
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
              {t('auth.password')} <span className="text-red-500">*</span>
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
            {signupLoading ? t('auth.creatingAccount') : t('auth.signUp')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <button
            onClick={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t('auth.signIn')}
          </button>
        </p>
      </Modal>
      </div>
    </BrowseAIProvider>
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
