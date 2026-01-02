"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid access token from Supabase redirect
    const checkToken = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setIsValidToken(false);
          setMessage("Invalid or expired reset link. Please request a new password reset.");
          setMessageType("error");
          return;
        }

        // If we have a session, the token is valid
        if (session) {
          setIsValidToken(true);
        } else {
          // Check if there's a hash in the URL (Supabase redirects with hash)
          const hash = window.location.hash;
          if (hash && hash.includes("access_token")) {
            // Supabase will handle the hash and create a session
            // Wait a moment for it to process
            setTimeout(async () => {
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (newSession) {
                setIsValidToken(true);
              } else {
                setIsValidToken(false);
                setMessage("Invalid or expired reset link. Please request a new password reset.");
                setMessageType("error");
              }
            }, 1000);
          } else {
            setIsValidToken(false);
            setMessage("Invalid or expired reset link. Please request a new password reset.");
            setMessageType("error");
          }
        }
      } catch (error: any) {
        console.error("Error validating token:", error);
        setIsValidToken(false);
        setMessage("Error validating reset link. Please try again.");
        setMessageType("error");
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      // Debug: Check if env vars are available
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setMessage("Error: Supabase environment variables are missing. Please check Vercel configuration.");
        setMessageType("error");
        setLoading(false);
        console.error('❌ Missing env vars:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
        });
        return;
      }

      const supabase = getSupabaseClient();
      
      // Update user password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setMessageType("error");
        setLoading(false);
      } else {
        setMessage("Password updated successfully! Redirecting to login...");
        setMessageType("success");
        setLoading(false);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error: any) {
      setMessage(`Unexpected error: ${error.message}`);
      setMessageType("error");
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error if token is invalid
  if (isValidToken === false) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Invalid Reset Link</h1>
          
          {message && (
            <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          <div className="text-center space-y-2">
            <Link href="/forgot-password" className="text-blue-600 hover:underline block">
              Request New Reset Link
            </Link>
            <Link href="/login" className="text-gray-600 hover:underline block text-sm">
              ← Back to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Set New Password</h1>
        <p className="text-gray-600 mb-6 text-center">
          Please enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm text-center ${
              messageType === "success"
                ? "bg-green-100 text-green-800"
                : messageType === "error"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

