"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setIsStandalone(true);
      return;
    }
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // ignore
    }
    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document));
    setShowBanner(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
      setDeferredPrompt(null);
    }
    setShowBanner(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div
      id="install-app-banner"
      className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-rose-600 text-white px-4 py-3 shadow-lg"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      role="banner"
      aria-label="Install app"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0" aria-hidden>📱</span>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">Yoyaku Yo</p>
          <p className="text-xs text-stone-300 truncate">
            {isIOS
              ? "Add to Home Screen to install / ホーム画面に追加"
              : deferredPrompt
                ? "Install app / アプリをインストール"
                : "Install: use browser menu (⋮) → Install app"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isIOS ? (
          <a
            href="#install-ios"
            onClick={(e) => {
              e.preventDefault();
              handleDismiss();
            }}
            className="px-3 py-1.5 text-sm font-medium bg-rose-500 hover:bg-rose-600 rounded-lg"
          >
            OK
          </a>
        ) : (
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 text-sm font-medium bg-rose-500 hover:bg-rose-600 rounded-lg"
          >
            {deferredPrompt ? "Install" : "OK"}
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 text-stone-400 hover:text-white rounded"
          aria-label="Dismiss"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
