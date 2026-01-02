// Admin login page - uses Supabase Auth, checks admin_users table for admin role
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations();

  // Check if already logged in as admin
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if user is admin by querying admin_users table
          const response = await fetch(`${apiUrl}/admin/stats`, {
            headers: {
              "x-user-id": session.user.id,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            // Already admin, redirect to dashboard
            router.push("/admin");
            return;
          }
        }
      } catch (err) {
        // Ignore errors, just stay on login page
        console.error("Error checking admin session:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkAdminSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseClient();
      
      // Step 1: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Step 2: Check if user is admin by calling admin API
      const checkAdminResponse = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          "x-user-id": authData.user.id,
          "Content-Type": "application/json",
        },
      });

      if (!checkAdminResponse.ok) {
        // Not an admin, sign out and show error
        await supabase.auth.signOut();
        setError("Admin access required. This account does not have admin privileges.");
        setLoading(false);
        return;
      }

      // Step 3: Success - redirect to admin dashboard
      router.push("/admin");
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("admin.adminLogin") || "Admin Login"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("admin.adminLoginDesc") || "Sign in to access the admin dashboard"}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t("common.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("common.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t("common.password") || "Password"}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t("common.password") || "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t("common.loading") || "Loading...") : (t("common.login") || "Sign in")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

