"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { AuthError } from '@supabase/supabase-js';
import { apiUrl } from '@/lib/apiClient';
import { authApi } from '@/lib/api';

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

export default function OwnerModals() {
  const router = useRouter();
  
  let t: ReturnType<typeof useTranslations>;
  let tAuth: ReturnType<typeof useTranslations>;
  try {
    t = useTranslations();
    tAuth = useTranslations('auth');
  } catch (error) {
    console.warn("🔥 useTranslations not ready, using fallback:", error);
    t = ((key: string) => key) as ReturnType<typeof useTranslations>;
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
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
    // Only listen for owner-specific events (from role selection modal)
    // DO NOT listen to openLoginModal/openSignupModal - those go to RoleSelectionModal first
    const handleOpenOwnerLoginModal = () => {
      // If Supabase session exists, restore and redirect (no re-entry).
      try {
        const supabase = getSupabaseClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            router.push('/shops');
            router.refresh();
          } else {
            setShowLoginModal(true);
          }
        }).catch(() => setShowLoginModal(true));
      } catch {
        setShowLoginModal(true);
      }
    };
    const handleOpenOwnerSignupModal = () => {
      setShowSignupModal(true);
    };
    if (typeof window !== 'undefined') {
      // Only listen for owner-specific events (from role selection modal)
      window.addEventListener('openOwnerLoginModal', handleOpenOwnerLoginModal);
      window.addEventListener('openOwnerSignupModal', handleOpenOwnerSignupModal);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openOwnerLoginModal', handleOpenOwnerLoginModal);
        window.removeEventListener('openOwnerSignupModal', handleOpenOwnerSignupModal);
      }
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const supabase = getSupabaseClient();

      // IMPORTANT: Use FormData so browser autofill works even with controlled inputs.
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email") || loginEmail || "");
      const password = String(fd.get("password") || loginPassword || "");
      // Keep state in sync (nice-to-have, but also helps error re-render).
      if (email && email !== loginEmail) setLoginEmail(email);
      if (password && password !== loginPassword) setLoginPassword(password);

      let authData: any = null;
      let signInError: any = null;

      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        authData = result.data;
        signInError = result.error;
      } catch (directError: any) {
        const isCorsError = directError?.message?.includes('CORS') || 
                           directError?.message?.includes('Failed to fetch') ||
                           directError?.name === 'TypeError';
        
        if (isCorsError) {
          try {
            const backendResponse = await authApi.login(email, password);
            
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

      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (!verifySession && authData.session) {
        await supabase.auth.setSession({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // CRITICAL: Verify owner exists in owners table first
      const { data: ownerCheck } = await supabase
        .from('owners')
        .select('id, email')
        .or(`id.eq.${authData.user.id},email.eq.${email.toLowerCase().trim()}`)
        .maybeSingle();

      if (!ownerCheck) {
        setLoginError('This account is not registered as an owner. Please use customer login.');
        setLoginLoading(false);
        return;
      }

      // CRITICAL: Ensure owner has role='owner' in users table
      try {
        // First check current role
        const roleResponse = await fetch(`${apiUrl}/users/me`, {
          headers: { 'x-user-id': authData.user.id },
        });

        let userRole = null;
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          userRole = roleData.user?.role || roleData.role;
        }

        // If role is not 'owner', try to sync/update it
        if (userRole !== 'owner') {
          console.log('[Owner Login] Owner found but role not set, syncing...');
          
          // Try to sync user with owner role
          try {
            await authApi.syncUser(
              authData.user.id,
              authData.user.email || email,
              authData.user.user_metadata?.name
            );
          } catch (syncError) {
            console.warn('Failed to sync user to users (non-blocking):', syncError);
          }

          // Try to update role directly via users table
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: authData.user.id,
              email: authData.user.email || email,
              role: 'owner',
              full_name: authData.user.user_metadata?.name || ownerCheck.name || null,
            }, {
              onConflict: 'id'
            });

          if (updateError) {
            console.warn('[Owner Login] Failed to update role in users table:', updateError);
          } else {
            console.log('[Owner Login] Successfully set role=owner in users table');
          }
        }

        // Wait a moment for the update to propagate
        await new Promise(resolve => setTimeout(resolve, 300));

        // Re-check role after update
        const finalRoleResponse = await fetch(`${apiUrl}/users/me`, {
          headers: { 'x-user-id': authData.user.id },
        });

        if (finalRoleResponse.ok) {
          const finalRoleData = await finalRoleResponse.json();
          const finalRole = finalRoleData.user?.role || finalRoleData.role;

          if (finalRole === 'owner') {
            // Owner: redirect to owner dashboard
            setShowLoginModal(false);
            setTimeout(() => {
              router.push('/owner/shop-profile');
              router.refresh();
            }, 300);
            return;
          } else if (finalRole === 'admin') {
            // Admin: redirect to admin dashboard
            setShowLoginModal(false);
            setTimeout(() => {
              router.push('/admin');
              router.refresh();
            }, 300);
            return;
          }
        }

        // If still not owner role, but owner exists in owners table, allow access anyway
        // (OwnerGuard will handle the final check)
        console.log('[Owner Login] Owner verified in owners table, allowing access');
        setShowLoginModal(false);
        setTimeout(() => {
          router.push('/owner/shop-profile');
          router.refresh();
        }, 300);
      } catch (roleError) {
        // If role check fails but owner exists in owners table, allow access
        console.error('Error checking user role:', roleError);
        console.log('[Owner Login] Owner verified in owners table, allowing access despite role check error');
        setShowLoginModal(false);
        setTimeout(() => {
          router.push('/owner/shop-profile');
          router.refresh();
        }, 300);
      }
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
        setSignupError(tAuth('fillRequiredFields') || 'Please fill in all required fields');
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
        setSignupError(errorData.error || tAuth('failedToSetupAccount') || 'Failed to setup account');
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
          setSignupError('Account created successfully! Please sign in manually with your email and password. If you received a confirmation email, please confirm it first.');
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
      router.push('/shops');
      router.refresh();
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      const errorMessage = err instanceof Error ? err.message : tAuth('unexpectedError') || 'An unexpected error occurred';
      setSignupError(errorMessage);
      setSignupLoading(false);
    }
  };

  return (
    <>
      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {tAuth('signInToShop') || 'Sign in to your shop'}
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
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
              {tAuth('password')}
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end -mt-2">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {tAuth('forgotPassword') || t('forgotPassword') || 'Forgot your password?'}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loginLoading ? (tAuth('signingIn') || 'Signing in...') : (tAuth('signIn') || 'Sign In')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {tAuth('dontHaveAccount') || "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {tAuth('joinAsOwner') || 'Join as Owner'}
          </button>
        </p>
      </Modal>

      {/* Signup Modal */}
      <Modal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {tAuth('createOwnerAccount') || 'Create Owner Account'}
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
              {tAuth('ownerName') || 'Owner Name'} <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              required
              autoComplete="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={tAuth('ownerName') || 'Owner Name'}
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
              {t('myShop.shopName') || 'Shop Name'} <span className="text-gray-400 text-xs">({t('common.optional') || 'Optional'})</span>
            </label>
            <input
              id="signup-shop-name"
              type="text"
              value={signupShopName}
              onChange={(e) => setSignupShopName(e.target.value)}
              autoComplete="organization"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t('myShop.shopName') || 'Shop Name'}
            />
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signupLoading ? (tAuth('creatingAccount') || 'Creating Account...') : (tAuth('signUp') || 'Sign Up')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {tAuth('alreadyHaveAccount') || 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {tAuth('signIn') || 'Sign In'}
          </button>
        </p>
      </Modal>
    </>
  );
}

