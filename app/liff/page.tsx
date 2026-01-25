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

function LiffEntryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"initializing" | "redirecting" | "ready" | "error">("initializing");
  const [error, setError] = useState<string>("");

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!LIFF_ID) {
      setError("LIFF ID not configured. Please check your environment variables.");
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
            script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
            document.body.appendChild(script);
          });
        }

        // Initialize LIFF
        await window.liff.init({ liffId: LIFF_ID });

        // CRITICAL: Force open inside LINE if not in client
        if (!window.liff.isInClient()) {
          setStatus("redirecting");
          const liffUrl = `https://liff.line.me/${LIFF_ID}/liff${window.location.search}`;
          
          // Try to open in LINE app
          try {
            window.liff.openWindow({
              url: liffUrl,
              external: false
            });
          } catch (openErr) {
            console.error("Failed to open in LINE:", openErr);
            setError("Please open this link in the LINE app. Scan the QR code using LINE app.");
            setStatus("error");
          }
          return;
        }

        // Verify login
        if (!window.liff.isLoggedIn()) {
          try {
            window.liff.login();
          } catch (loginErr) {
            console.error("Login error:", loginErr);
            setError("Failed to login to LINE. Please try again.");
            setStatus("error");
          }
          return;
        }

        // Get profile to verify LINE context
        let profile;
        try {
          profile = await window.liff.getProfile();
        } catch (profileErr) {
          console.error("Profile error:", profileErr);
          setError("Failed to get LINE profile. Please try again.");
          setStatus("error");
          return;
        }
        
        if (!profile || !profile.userId) {
          setError("Failed to get LINE profile. Please try again.");
          setStatus("error");
          return;
        }

        // Success - redirect to main LIFF app
        // The /line-app route handles LIFF initialization properly
        setStatus("ready");
        const shopId = searchParams?.get("shop_id");
        const tab = searchParams?.get("tab");
        
        // Handle empty shop_id parameter
        const validShopId = shopId && shopId.trim() !== "" ? shopId : null;
        
        // Build redirect URL with query params
        let redirectUrl = "/line-app";
        const params = new URLSearchParams();
        if (tab) params.set("tab", tab);
        if (validShopId) {
          redirectUrl = `/line-app/shops/${validShopId}`;
        } else if (params.toString()) {
          redirectUrl = `/line-app?${params.toString()}`;
        }
        
        // Use replace instead of push to avoid adding to history
        router.replace(redirectUrl);
      } catch (err: any) {
        console.error("LIFF initialization error:", err);
        setError(err.message || "Failed to initialize LINE app. Please make sure you're opening this in the LINE app.");
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

export default function LiffEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LiffEntryPageContent />
    </Suspense>
  );
}

