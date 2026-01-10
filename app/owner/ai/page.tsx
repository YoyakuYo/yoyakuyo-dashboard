// app/owner/ai/page.tsx
// Owner AI Assistant page - full AI chat interface

"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useAIConversation } from "@/lib/useAIConversation";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from 'next-intl';

export default function OwnerAIPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [shop, setShop] = useState<any>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use ai_conversations with user_type='owner'
  const { messages, addMessage, saving } = useAIConversation({
    userType: 'owner',
    userId: user?.id || undefined,
    contextKey: 'owner_ai_assistant',
    shopId: shop?.id || undefined,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadShop();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadShop = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        const shops = data.shops || [];
        if (shops.length > 0) {
          setShop(shops[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || loading || saving) return;

    // Check if shop is loaded, if not try to load it first
    let currentShop = shop;
    if (!currentShop && user?.id) {
      try {
        const res = await fetch(`${apiUrl}/shops/owner`, {
          headers: { 'x-user-id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          const shops = data.shops || [];
          if (shops.length > 0) {
            currentShop = shops[0];
            setShop(currentShop);
          }
        }
      } catch (error) {
        console.error('Error loading shop:', error);
      }
    }

    // If still no shop, show error and return
    if (!currentShop || !currentShop.id) {
      setError("🤖 AI Assistant: I need your shop ID to help you. Please make sure you're logged in and have a shop set up.");
      setLoading(false);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message to conversation (will be saved to ai_conversations)
    await addMessage('user', userMessage);

    // Get AI response
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (user.id) {
        headers["x-user-id"] = user.id;
      }

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          role: "owner",
          messages: [
            ...messages.map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: "user",
              content: userMessage,
            },
          ],
          userId: user.id,
          shopId: currentShop.id,
          shopContext: {
            shopId: currentShop.id,
            shopName: currentShop.name,
            shopAddress: currentShop.address,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const aiResponse = data.response || t('assistant.couldNotProcess');

      // Add AI response to conversation
      await addMessage('assistant', aiResponse);
    } catch (error) {
      console.error("Error getting AI response:", error);
      await addMessage('assistant', t('assistant.errorEncountered'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('assistant.title')}</h1>

      <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg mb-2">{t('assistant.greeting')}</p>
              <p>{t('assistant.greetingDesc')}</p>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  {message.timestamp && (
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('assistant.askQuestion')}
              disabled={loading || saving}
            />
            <button
              type="submit"
              disabled={loading || saving || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || saving ? t('messages.sending') : t('chat.send')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

