"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useOwnerAIChat } from "@/app/components/OwnerAIChat";

export default function AssistantPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { openChat } = useOwnerAIChat();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Open the AI chat bubble when this page loads
  useEffect(() => {
    if (user && !authLoading) {
      openChat();
    }
  }, [user, authLoading, openChat]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Just show a simple message - the bubble will open automatically
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Opening AI Assistant...</p>
      </div>
    </div>
  );
}

