"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// AI chat must live ONLY inside the LINE LIFF "AI Assistant" section (no separate chat page).
export default function LineChatPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/line-app?tab=ai");
  }, [router]);

  return null;
}

