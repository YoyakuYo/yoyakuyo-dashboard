"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    const isSecure =
        typeof window !== "undefined" &&
        ("https:" === window.location.protocol ||
          "localhost" === window.location.hostname);
    if (typeof window !== "undefined" && "serviceWorker" in navigator && isSecure) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
