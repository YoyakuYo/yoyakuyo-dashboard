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
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        openChat();
      }, 100);
      return () => clearTimeout(timer);
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
  // Redirect to shops page after opening chat
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">AI Assistant is opening...</p>
        <button
          onClick={() => router.push('/shops')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to My Shop
        </button>
      </div>
    </div>
  );
}

