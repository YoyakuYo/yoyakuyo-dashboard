"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from "@/lib/supabaseClient";
import { authApi } from "@/lib/api";
import { useAuthRole } from "@/lib/AuthRoleContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const t = useTranslations();
  const { selectedRole, setSelectedRole } = useAuthRole();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // CRITICAL: Require role selection before login
    if (!selectedRole) {
      setMessage("Error: Please select whether you are logging in as Owner or Customer");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      let authData: any = null;
      let authError: any = null;

      // NOTE: Role validation is handled by checking role after authentication
      // We don't block login here to avoid breaking the existing flow

      // Try direct Supabase auth first (fastest, works if CORS is configured)
      try {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        authData = result.data;
        authError = result.error;
      } catch (directError: any) {
        // If CORS error or network error, fallback to backend
        const isCorsError = directError?.message?.includes('CORS') || 
                           directError?.message?.includes('Failed to fetch') ||
                           directError?.name === 'TypeError';
        
        if (isCorsError) {
          console.log('CORS error detected, using backend login route...');
          
          // Use backend login route (bypasses CORS)
          try {
            const backendResponse = await authApi.login(email, password);
            
            if (backendResponse.success && backendResponse.session) {
              // Set session in Supabase client
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: backendResponse.session.access_token,
                refresh_token: backendResponse.session.refresh_token,
              });

              if (setSessionError) {
                setMessage(`Error: ${setSessionError.message}`);
                setLoading(false);
                return;
              }

              // Get user from session
              const { data: { user } } = await supabase.auth.getUser();
              authData = { user, session: backendResponse.session };
              authError = null;
            } else {
              authError = { message: backendResponse.error || 'Login failed' };
            }
          } catch (backendError: any) {
            authError = { message: backendError.message || 'Login failed' };
          }
        } else {
          // Other error, use it directly
          authError = directError;
        }
      }

      if (authError) {
        setMessage(`Error: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setMessage('Error: Login failed - no user data');
        setLoading(false);
        return;
      }

      // Login successful - sync user to users table (non-blocking)
      try {
        await authApi.syncUser(
          authData.user.id,
          authData.user.email || email,
          authData.user.user_metadata?.name
        );
        console.log('User synced to users table');
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

      // Enforce role from backend only: each email has one role (admin | owner | customer).
      // Only approved emails can log in; redirect by actual role, never by selected role.
      setMessage("Login successful! Redirecting...");
      setSelectedRole(null);

      try {
        const { apiUrl } = await import('@/lib/apiClient');
        const roleResponse = await fetch(`${apiUrl}/users/me`, {
          headers: { 'x-user-id': authData.user.id },
        });
        const roleData = roleResponse.ok ? await roleResponse.json() : null;
        const userRole = roleData?.user?.role ?? null;

        if (roleResponse.status === 403 || userRole == null) {
          await supabase.auth.signOut();
          setMessage(roleData?.message || roleData?.error || "This email is not authorized to log in. Contact support if you believe this is an error.");
          setLoading(false);
          return;
        }

        if (userRole === 'admin') {
          setTimeout(() => { router.push("/admin"); router.refresh(); }, 300);
        } else if (userRole === 'owner') {
          // Owners may only log in after their shop is verified
          try {
            const shopsRes = await fetch(`${apiUrl}/shops/owner`, {
              headers: { 'x-user-id': authData.user.id },
            });

            let hasVerifiedShop = false;
            if (shopsRes.ok) {
              const shopsData = await shopsRes.json();
              const shops = Array.isArray(shopsData)
                ? shopsData
                : (shopsData.shops && Array.isArray(shopsData.shops) ? shopsData.shops : []);

              hasVerifiedShop = shops.some(
                (shop: any) =>
                  shop.is_verified === true ||
                  shop.verification_status === 'approved'
              );
            }

            if (!hasVerifiedShop) {
              await supabase.auth.signOut();
              setMessage("Your shop is not verified yet. You will be able to log in after verification.");
              setLoading(false);
              return;
            }
          } catch (verifyError) {
            console.error('Error checking shop verification:', verifyError);
            await supabase.auth.signOut();
            setMessage("Could not verify your shop status. Please try again later.");
            setLoading(false);
            return;
          }

          setTimeout(() => { router.push("/owner/shop-profile"); router.refresh(); }, 300);
        } else {
          setTimeout(() => { router.push("/customer/home"); router.refresh(); }, 300);
        }
      } catch (roleError) {
        console.error('Error resolving role:', roleError);
        await supabase.auth.signOut();
        setMessage("Could not verify your account. Please try again or contact support.");
        setLoading(false);
      }
    } catch (error: any) {
      setMessage(`Unexpected error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        
        <form onSubmit={handleLogin} autoComplete="on" className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

