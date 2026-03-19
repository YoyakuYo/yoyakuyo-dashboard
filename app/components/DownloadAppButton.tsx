"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function DownloadAppButton() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // LINE mini-app runs inside WebView — hide PWA “Download” on those routes only
    if (pathname?.startsWith("/line-app")) {
      setVisible(false);
      return;
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document));
    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [pathname]);

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIOS && typeof window !== "undefined") {
      alert("To install: tap the Share icon (□↑) then \"Add to Home Screen\".\n\nインストール: 共有 → 「ホーム画面に追加」をタップ");
    }
  };

  if (pathname?.startsWith("/line-app") || !visible) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium shadow-lg hover:bg-blue-700 active:scale-[0.98]"
      style={{ bottom: "max(24px, calc(env(safe-area-inset-bottom) + 12px))" }}
      aria-label="Download app"
    >
      <span aria-hidden>↓</span>
      <span>Download</span>
    </button>
  );
}
