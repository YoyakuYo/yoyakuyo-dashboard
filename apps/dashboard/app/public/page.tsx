// apps/dashboard/app/public/page.tsx
// Public home page with authentication modals

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { AuthError } from '@supabase/supabase-js';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

export const dynamic = 'force-dynamic';

// Modal component - defined outside to prevent recreation on every render
const Modal = React.memo(({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
      onClick={onClose}
      onMouseDown={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Prevent ESC key from bubbling up
          if (e.key === 'Escape') {
            e.stopPropagation();
          }
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
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

export default function PublicHomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations();
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
    // Listen for modal open events from navbar
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
      
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError) {
        // Return proper error message from Supabase
        setLoginError(signInError.message || 'Invalid login credentials');
        setLoginLoading(false);
        return;
      }

      if (!authData.user) {
        setLoginError('Login failed: No user data returned');
        setLoginLoading(false);
        return;
      }

      // Step 2: Verify session is stored (Supabase automatically stores it)
      // Get the session to ensure it's properly set
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error after login:', sessionError);
      }

      if (!currentSession && authData.session) {
        // Session should be automatically stored, but if not, use the one from signIn
        console.warn('Session not found after login, using signIn session');
      }

      // Step 3: Fetch user profile from public.users (optional, for display purposes)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', authData.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is okay (user might not have profile yet)
        console.warn('Could not fetch user profile:', profileError);
        // Continue anyway - user can still access the dashboard
      }

      // Step 4: Close modal and redirect to owner dashboard
      // Session is automatically stored by Supabase, no need to wait
      setShowLoginModal(false);
      router.push('/owner/dashboard');
      router.refresh();
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
      // Validate required fields
      if (!signupName || !signupEmail || !signupPassword) {
        setSignupError(t('auth.fillRequiredFields'));
        setSignupLoading(false);
        return;
      }

      const supabase = getSupabaseClient();

      // Step 1: Create user in Supabase Auth
      console.log('Creating user in Supabase Auth...');
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
        console.error('Signup error:', signUpError);
        setSignupError(signUpError.message);
        setSignupLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('No user returned from signup');
        setSignupError('Failed to create user account');
        setSignupLoading(false);
        return;
      }

      const userId = authData.user.id;
      console.log('User created in Auth:', userId);

      // Step 2: Create user record in public.users and shop via backend API
      console.log('Setting up user record and shop...');
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
        console.error('Setup API error:', errorData);
        setSignupError(errorData.error || t('auth.failedToSetupAccount'));
        setSignupLoading(false);
        return;
      }

      const setupData = await setupRes.json();
      console.log('Account setup successful:', setupData);

      // Step 3: Check if user is signed in
      // signUp() may return a session if email confirmation is disabled
      let session = authData.session;
      
      if (!session) {
        // Check current session
        console.log('Checking current session...');
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
      }
      
      if (!session) {
        // If no session, wait a moment for user to be ready, then try to sign in
        console.log('No session found, waiting for user to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          // Account was created successfully, but sign-in failed
          // This might be due to email confirmation requirement or timing
          // Show helpful message and let user sign in manually
          setSignupError(`Account created successfully! Please sign in manually with your email and password. If you received a confirmation email, please confirm it first.`);
          setSignupLoading(false);
          setShowSignupModal(false);
          // Show login modal instead
          setTimeout(() => {
            setShowLoginModal(true);
          }, 500);
          return;
        }
        
        session = signInData.session;
        console.log('✅ Signed in successfully');
      } else {
        console.log('✅ User already has active session');
      }

      // Success - wait a moment for auth state to update, then close modal and redirect
      
      // Small delay to ensure auth state updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Close modal only after successful setup
      setShowSignupModal(false);
      
      // Redirect to owner dashboard
      router.push('/owner/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      const errorMessage = err instanceof Error ? err.message : t('auth.unexpectedError');
      setSignupError(errorMessage);
      setSignupLoading(false);
    }
  };

  // Stable callbacks for modal close handlers
  const handleCloseLoginModal = useCallback(() => setShowLoginModal(false), []);
  const handleCloseSignupModal = useCallback(() => setShowSignupModal(false), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('home.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            {t('home.subtitle')}
          </p>
          <ul className="space-y-3 mb-10 max-w-2xl mx-auto text-left">
            <li className="flex items-start gap-3">
              <span className="text-2xl mt-1">✓</span>
              <span className="text-lg text-gray-700">
                {t('home.feature1')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl mt-1">✓</span>
              <span className="text-lg text-gray-700">
                {t('home.feature2')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl mt-1">✓</span>
              <span className="text-lg text-gray-700">
                {t('home.feature3')}
              </span>
            </li>
          </ul>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/browse"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {t('home.browseShops')}
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLoginModal(true);
              }}
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-300"
            >
              {t('home.ownerLogin')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSignupModal(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {t('home.joinAsOwner')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('home.forCustomers')}
              </h3>
              <p className="text-gray-600">
                {t('home.forCustomersDesc')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">👔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('home.forOwners')}
              </h3>
              <p className="text-gray-600">
                {t('home.forOwnersDesc')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('home.aiAssistance')}
              </h3>
              <p className="text-gray-600">
                {t('home.aiAssistanceDesc')}
              </p>
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
            type="button"
            disabled={signupLoading}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              // Call handler directly with a minimal event object
              const formEvent = {
                preventDefault: () => {},
                stopPropagation: () => {},
              } as unknown as React.FormEvent<HTMLFormElement>;
              await handleSignupSubmit(formEvent);
            }}
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
  );
}

