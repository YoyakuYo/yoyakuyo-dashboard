"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page immediately
    router.push("/");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Customer Login Disabled</h1>
        <p className="text-gray-600 mb-6">
          Customer accounts are no longer available. You can book appointments as a guest without creating an account.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    </main>
  );
}