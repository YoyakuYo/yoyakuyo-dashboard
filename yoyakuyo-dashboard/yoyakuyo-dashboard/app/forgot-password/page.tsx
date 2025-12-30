"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

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
      
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://yoyakuyo-dashboard.vercel.app/reset-password",
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setMessageType("error");
        setLoading(false);
      } else {
        setMessage("Password reset email sent! Please check your inbox and follow the instructions to reset your password.");
        setMessageType("success");
        setLoading(false);
        // Clear email field after successful submission
        setEmail("");
      }
    } catch (error: any) {
      setMessage(`Unexpected error: ${error.message}`);
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Reset Password</h1>
        <p className="text-gray-600 mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
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

        <div className="mt-6 text-center space-y-2">
          <Link href="/login" className="text-blue-600 hover:underline block">
            ← Back to Login
          </Link>
          <Link href="/" className="text-gray-600 hover:underline block text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

