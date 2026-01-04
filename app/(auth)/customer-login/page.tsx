"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function CustomerLoginPage() {
  const t = useTranslations();
  const { signIn } = useCustomAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // IMPORTANT: Use FormData so browser autofill works even with controlled inputs.
    const form = e.currentTarget;
    const fd = new FormData(form);
    const emailFromForm = String(fd.get("email") || email || "");
    const passwordFromForm = String(fd.get("password") || password || "");

    const result = await signIn(emailFromForm, passwordFromForm, 'customer');

    if (!result.success) {
      // Check if error is owner/admin access denied
      if (result.error?.includes('Owners cannot use customer login') || 
          result.error?.includes('Admins cannot use customer login') ||
          result.error?.includes('OWNER_ACCESS_DENIED') ||
          result.error?.includes('ADMIN_ACCESS_DENIED')) {
        setMessage(`Error: ${result.error}`);
        setLoading(false);
        setTimeout(() => {
          router.push('/login?error=owner_cannot_access_customer_dashboard');
        }, 2000);
        return;
      }
      setMessage(`Error: ${result.error || 'Login failed'}`);
      setLoading(false);
      return;
    }

    // CRITICAL: Verify customer after successful authentication (similar to owner login)
    // Customer login uses useCustomAuth (JWT), not Supabase Auth
    // Get user from localStorage (stored by useCustomAuth)
    try {
      // Get user from localStorage (stored by useCustomAuth after successful login)
      const storedUser = typeof window !== 'undefined' 
        ? localStorage.getItem('yoyaku_user') 
        : null;
      
      if (!storedUser) {
        // If user not in localStorage, backend validation already passed, so allow access
        console.log('[Customer Login] User not in localStorage, but backend validation passed - allowing access');
      } else {
        const userData = JSON.parse(storedUser);
        const userId = userData.id;
        const userEmail = userData.email || emailFromForm;

        // Check if user is a customer - check users table FIRST (most reliable)
        const supabase = getSupabaseClient();
        const { data: dbUserData, error: userError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', userId)
          .maybeSingle();

        let isCustomer = false;

        // Check if user has role='customer' or no role (default to customer)
        if (dbUserData) {
          const role = dbUserData.role;
          // Customer if role is 'customer', null, or undefined (not 'owner' or 'admin')
          if (role === 'customer' || !role || (role !== 'owner' && role !== 'admin' && role !== 'super_admin')) {
            isCustomer = true;
            console.log('[Customer Login] ✅ Customer found in users table:', { role: role || 'no role (default customer)' });
          }
        } else {
          // User doesn't exist in users table - check owners table to block owners
          const { data: ownerData } = await supabase
            .from('owners')
            .select('id, email')
            .or(`id.eq.${userId},email.eq.${userEmail.toLowerCase().trim()}`)
            .maybeSingle();

          if (ownerData) {
            // User is an owner - clear session and show error
            if (typeof window !== 'undefined') {
              localStorage.removeItem('yoyaku_session');
              localStorage.removeItem('yoyaku_user');
            }
            setMessage('This account is registered as an owner. Please use owner login.');
            setLoading(false);
            return;
          }

          // Not found in users or owners table - default to customer (allow access)
          // Backend already validated, so this is safe
          isCustomer = true;
          console.log('[Customer Login] ✅ User not found in users/owners table, defaulting to customer');
        }

        if (!isCustomer) {
          // User is an owner or admin - clear session and show error
          if (typeof window !== 'undefined') {
            localStorage.removeItem('yoyaku_session');
            localStorage.removeItem('yoyaku_user');
          }
          setMessage('This account is not registered as a customer. Please use owner login.');
          setLoading(false);
          return;
        }
      }

      // CRITICAL: Persist role immediately after successful Customer login
      if (typeof window !== 'undefined') {
        localStorage.setItem('yoyaku_selected_auth_role', 'customer');
      }
      console.log('[Customer Login] ✅ Role persisted: customer');

      // CRITICAL: Force redirect to customer dashboard after successful login
      setMessage("Login successful! Redirecting...");
      setLoading(false);
      
      // Use router.replace to ensure redirect happens
      router.replace("/customer/home");
      router.refresh();
      
      // Also use setTimeout as backup
      setTimeout(() => {
        router.replace("/customer/home");
        router.refresh();
      }, 100);
    } catch (verifyError) {
      console.error('Error verifying customer:', verifyError);
      // If verification fails, still allow access (safer for customers)
      // Backend already validated, so this is safe
      setMessage("Login successful! Redirecting...");
      setLoading(false);
      router.replace("/customer/home");
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Customer Login</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Sign in to your customer account</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
            message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/customer-signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

