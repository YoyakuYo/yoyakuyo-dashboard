"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Salon Dashboard</h1>
        {user ? (
          <>
            <p className="text-lg text-gray-600 mb-4">
              Welcome back, {user.email}!
            </p>
            <p className="text-sm text-gray-500 mb-8">
              You are successfully logged in.
            </p>
            <div className="space-x-4">
              <button
                onClick={handleLogout}
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-lg text-gray-600 mb-8">
              Welcome to the YoyakuYo booking management system
            </p>
            <div className="space-x-4">
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
