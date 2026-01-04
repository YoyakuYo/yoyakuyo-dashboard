"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCustomAuth } from "@/lib/useCustomAuth";

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
      setMessage(`Error: ${result.error || 'Login failed'}`);
      setLoading(false);
      return;
    }

    // CRITICAL: Check user role and block owners/admins from customer dashboard
    setMessage("Login successful! Verifying access...");
    try {
      const { apiUrl } = await import('@/lib/apiClient');
      const { useAuth } = await import('@/lib/useAuth');
      
      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get user from auth
      const supabase = await import('@/lib/supabaseClient').then(m => m.getSupabaseClient());
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const roleResponse = await fetch(`${apiUrl}/users/me`, {
          headers: { 'x-user-id': user.id },
        });

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          const userRole = roleData.user?.role || roleData.role;

          // Block owners and admins from customer dashboard
          if (userRole === 'owner') {
            setMessage('Error: Owners cannot access customer dashboard. Please use owner login.');
            setLoading(false);
            setTimeout(() => {
              router.push('/login?error=owner_cannot_access_customer_dashboard');
            }, 2000);
            return;
          } else if (userRole === 'admin') {
            setMessage('Error: Admins cannot access customer dashboard.');
            setLoading(false);
            setTimeout(() => {
              router.push('/login?error=admin_cannot_access_customer_dashboard');
            }, 2000);
            return;
          }
        }
      }
      
      // Customer or no role - allow access
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/customer/home");
        router.refresh();
      }, 300);
    } catch (roleError) {
      // If role check fails, allow access (safer for customers)
      console.error('Error checking user role:', roleError);
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/customer/home");
        router.refresh();
      }, 300);
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

