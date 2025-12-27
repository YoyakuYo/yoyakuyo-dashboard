"use client";

import { useEffect, useState, useRef } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { apiUrl } from "@/lib/apiClient";
import { useBrowseAIContext } from "@/app/components/BrowseAIContext";
import { useAIConversation, ConversationIdentity } from "@/lib/useAIConversation";

export default function CustomerChatPage() {
  const { user, session } = useCustomAuth();
  const browseContext = useBrowseAIContext();
  const shopContext = browseContext?.shopContext;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationStateId, setConversationStateId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('yoyakuyo_conversation_state_id');
  });
  const [quickReplies, setQuickReplies] = useState<Array<{ label: string; payload: string }> | null>(null);
  const [shopCards, setShopCards] = useState<Array<{ shop_name: string; address: string | null; href: string; cta: string }> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use ai_conversations with user_type='customer'
  const conversationIdentity: ConversationIdentity = {
    userType: 'customer',
    userId: user?.id || null,
    contextKey: 'customer_dashboard',
    shopId: shopContext?.shopId || null,
  };

  const { messages, addMessage, setMessages, saveConversation, loading: conversationLoading } = useAIConversation(conversationIdentity);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const doSend = async (userMessage: string) => {
    if (!userMessage.trim() || !user || loading) return;
    setLoading(true);
    setQuickReplies(null);
    setShopCards(null);

    // Add user message to conversation (will be saved to ai_conversations)
    await addMessage('user', userMessage);

    try {
      // Build messages array for API
      const apiMessages = [
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user",
          content: userMessage,
        },
      ];

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (session?.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
      }

      // Get customer profile to pass to AI
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: customerProfile } = await supabase
        .from("customer_profiles")
        .select("id, name, email, preferred_language")
        .eq("customer_auth_id", user.id)
        .maybeSingle();

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          role: "customer",
          messages: apiMessages,
          userId: user.id,
          customerId: customerProfile?.id || user.id,
          conversation_state_id: conversationStateId || undefined,
          customerProfile: customerProfile ? {
            customerId: customerProfile.id,
            customerName: customerProfile.name || null,
            customerEmail: customerProfile.email || null,
            preferredLanguage: customerProfile.preferred_language || 'en',
          } : null,
          shopContext: shopContext?.shopId ? {
            shopId: shopContext.shopId,
            shopName: shopContext.shopName,
            category: shopContext.category,
            prefecture: shopContext.prefecture,
            address: shopContext.address,
            ownerId: shopContext.ownerId,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.response || data.message || "I'm sorry, I couldn't process that request.";

      if (data.conversation_state_id && typeof data.conversation_state_id === 'string') {
        setConversationStateId(data.conversation_state_id);
        try {
          localStorage.setItem('yoyakuyo_conversation_state_id', data.conversation_state_id);
        } catch {}
      }
      setQuickReplies(Array.isArray(data.quick_replies) ? data.quick_replies : null);
      setShopCards(Array.isArray(data.shop_cards) ? data.shop_cards : null);

      // Add AI response to conversation (will be saved to ai_conversations)
      await addMessage('assistant', aiMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);
      await addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || loading) return;
    const userMessage = input.trim();
    setInput("");
    await doSend(userMessage);
  };

  const handleQuickReply = async (payload: string) => {
    if (!user || loading) return;
    await doSend(payload);
  };

  const startNewChat = async () => {
    // Create new conversation by clearing messages and saving
    setMessages([]);
    await saveConversation([]);
  };

  if (conversationLoading) {
    return (
      <div className="p-8 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <button
          onClick={startNewChat}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Start New Chat
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">👋 Hello! How can I help you today?</p>
              <p className="text-sm">Ask me about bookings, shops, or anything else!</p>
            </div>
          )}
          {messages.map((message: any) => (
            <div
              key={message.timestamp || `msg-${Math.random()}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {shopCards && shopCards.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="space-y-2">
              {shopCards.map((c, idx) => (
                <a key={`${c.href}-${idx}`} href={c.href} className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="text-sm font-semibold text-gray-900">{c.shop_name}</div>
                  {c.address && <div className="text-xs text-gray-600 mt-1">{c.address}</div>}
                  <div className="text-xs text-blue-700 font-semibold mt-2">{c.cta || 'View Shop'}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {quickReplies && quickReplies.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((qr, idx) => (
                <button
                  key={`${qr.payload}-${idx}`}
                  type="button"
                  onClick={() => handleQuickReply(qr.payload)}
                  disabled={loading}
                  className="px-3 py-2 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
