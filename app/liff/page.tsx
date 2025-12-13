"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LiffEntryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"initializing" | "redirecting" | "ready" | "error">("initializing");
  const [error, setError] = useState<string>("");

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

  useEffect(() => {
    if (typeof window === "undefined" || !LIFF_ID) {
      setError("LIFF ID not configured");
      setStatus("error");
      return;
    }

    const initLiff = async () => {
      try {
        // Load LIFF SDK
        if (!window.liff) {
          const script = document.createElement("script");
          script.src = "https://static.line-scdn.net/liff/edge/versions/2.24.0/sdk.js";
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Initialize LIFF
        await window.liff.init({ liffId: LIFF_ID });

        // CRITICAL: Force open inside LINE if not in client
        if (!window.liff.isInClient()) {
          setStatus("redirecting");
          const currentUrl = window.location.href;
          const liffUrl = `https://liff.line.me/${LIFF_ID}${window.location.search}`;
          
          window.liff.openWindow({
            url: liffUrl,
            external: false
          });
          return;
        }

        // Verify login
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }

        // Get profile to verify LINE context
        const profile = await window.liff.getProfile();
        
        if (!profile || !profile.userId) {
          setError("Failed to get LINE profile");
          setStatus("error");
          return;
        }

        // Success - redirect to main LIFF app
        setStatus("ready");
        const shopId = searchParams.get("shop_id");
        const tab = searchParams.get("tab");
        
        if (shopId) {
          router.push(`/line-app/shops/${shopId}`);
        } else if (tab) {
          router.push(`/line-app?tab=${tab}`);
        } else {
          router.push("/line-app");
        }
      } catch (err: any) {
        console.error("LIFF initialization error:", err);
        setError(err.message || "Failed to initialize LINE app");
        setStatus("error");
      }
    };

    initLiff();
  }, [LIFF_ID, router, searchParams]);

  if (status === "initializing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing LINE App...</p>
        </div>
      </div>
    );
  }

  if (status === "redirecting") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Opening in LINE app...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">LINE App Required</h1>
          <p className="text-gray-600 mb-4">{error || "Please open this link in the LINE app."}</p>
          <p className="text-sm text-gray-500">
            Scan the QR code or add the LINE Official Account to access the booking platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

