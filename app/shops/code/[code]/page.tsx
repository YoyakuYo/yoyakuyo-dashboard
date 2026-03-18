"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

interface ShopLookupResponse {
  shop?: { id: string; name: string };
}

async function fetchShopByNumber(num: number): Promise<ShopLookupResponse | null> {
  const res = await fetch(`${apiUrl}/shops?shop_number=${num}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("lookup failed");
  return res.json();
}

async function fetchShopByVerificationCode(code: string): Promise<ShopLookupResponse | null> {
  const res = await fetch(`${apiUrl}/shops?verification_code=${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("lookup failed");
  return res.json();
}

export default function ShopCodeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const raw = (params?.code as string) || "";
  const code = raw.trim();
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
        // S0001 style → verified code only
        if (/^S\d+$/i.test(code)) {
          const data = await fetchShopByVerificationCode(code.toUpperCase());
          if (data?.shop?.id) {
            router.replace(`/shops/${data.shop.id}`);
            return;
          }
          setError("Shop not found for this code.");
          setLoading(false);
          return;
        }

        const digits = code.replace(/\D/g, "");
        const num = parseInt(digits, 10);

        // Digits only: try shop number 1–5000 first, then S + 4-digit verified code
        if (digits && !Number.isNaN(num) && num >= 1 && num <= 5000) {
          const byNum = await fetchShopByNumber(num);
          if (byNum?.shop?.id) {
            router.replace(`/shops/${byNum.shop.id}`);
            return;
          }
        }

        if (digits.length >= 1 && digits.length <= 4) {
          const sCode = "S" + digits.padStart(4, "0");
          const data = await fetchShopByVerificationCode(sCode);
          if (data?.shop?.id) {
            router.replace(`/shops/${data.shop.id}`);
            return;
          }
        }

        setError("Shop not found for this code.");
        setLoading(false);
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
              Looking up shop for code{" "}
              <span className="font-mono font-semibold">{code}</span>...
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
