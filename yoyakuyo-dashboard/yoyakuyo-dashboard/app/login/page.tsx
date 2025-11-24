"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { authApi } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseClient();
      let authData: any = null;
      let authError: any = null;

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

      // Login successful - sync user to users table
      try {
        await authApi.syncUser(
          authData.user.id,
          authData.user.email || email,
          authData.user.user_metadata?.name
        );
        console.log('User synced to users table');
      } catch (syncError) {
        // Log error but don't block login
        console.warn('Failed to sync user to users (non-blocking):', syncError);
      }

      // Redirect to dashboard
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch (error: any) {
      setMessage(`Unexpected error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

