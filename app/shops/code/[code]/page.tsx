"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

interface ShopLookupResponse {
  shop?: { id: string; name: string };
}

export default function ShopCodeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lookup = async () => {
      if (!code) {
        setError("Invalid shop code.");
        setLoading(false);
        return;
      }

      try {
        const url = `${apiUrl}/shops?verification_code=${encodeURIComponent(
          code
        )}`;
        const res = await fetch(url);

        if (res.status === 404) {
          setError("Shop not found for this code.");
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError("Failed to look up shop.");
          setLoading(false);
          return;
        }

        const data: ShopLookupResponse = await res.json();
        if (data.shop && data.shop.id) {
          router.replace(`/shops/${data.shop.id}`);
        } else {
          setError("Shop not found for this code.");
          setLoading(false);
        }
      } catch (e) {
        console.error("Error looking up shop by code:", e);
        setError("Failed to look up shop.");
        setLoading(false);
      }
    };

    lookup();
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 px-6 py-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="inline-block h-10 w-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-gray-700 text-sm">
              Looking up shop for code <span className="font-mono font-semibold">{code}</span>...
            </p>
          </>
        ) : error ? (
          <>
            <p className="text-red-600 font-medium mb-2">Unable to find shop</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Back to home
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

