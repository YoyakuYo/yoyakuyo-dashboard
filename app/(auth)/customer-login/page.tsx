"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CustomerLoginPage() {
  const t = useTranslations();
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setMessage('Error: Login failed - no user data');
        setLoading(false);
        return;
      }

      // Check if user has a customer profile
      const { data: profile, error: profileError } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      // If no profile exists, create one
      if (!profile && !profileError) {
        await supabase.from("customer_profiles").insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Customer",
          email: data.user.email || email,
        });
      }

      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to customer dashboard
      setMessage("Login successful! Redirecting...");
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
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Customer Login</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Sign in to your customer account</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
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

