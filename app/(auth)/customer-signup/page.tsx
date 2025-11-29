"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CustomerSignupPage() {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Error: Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            user_type: 'customer', // Mark as customer
          },
        },
      });

      if (authError) {
        setMessage(`Error: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setMessage('Error: Signup failed - no user data');
        setLoading(false);
        return;
      }

      // Create customer profile
      const { error: profileError } = await supabase
        .from("customer_profiles")
        .insert({
          id: authData.user.id,
          name: name,
          email: email,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Continue anyway - profile might already exist
      }

      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to customer dashboard
      setMessage("Account created! Redirecting...");
      setTimeout(() => {
        router.push("/customer");
        router.refresh();
      }, 300);
    } catch (error: any) {
      setMessage(`Unexpected error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Create Customer Account</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Sign up to book appointments and save favorites</p>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
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
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
              Password
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
            <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-700">
              Confirm Password
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
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Creating account..." : "Sign Up"}
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
            Already have an account?{" "}
            <Link href="/customer-login" className="text-blue-600 hover:underline font-medium">
              Login
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

