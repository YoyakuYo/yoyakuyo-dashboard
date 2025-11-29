"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

export default function CustomerChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initializeSession();
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    
    // Get or create session
    const { data: existingSession } = await supabase
      .from("customer_chat_sessions")
      .select("id")
      .eq("customer_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      setSessionId(existingSession.id);
    } else {
      // Create new session
      const { data: newSession, error } = await supabase
        .from("customer_chat_sessions")
        .insert({
          customer_id: user.id,
        })
        .select()
        .single();

      if (!error && newSession) {
        setSessionId(newSession.id);
      }
    }
  };

  const loadHistory = async () => {
    if (!sessionId) return;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("customer_chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || !user) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message to UI
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Save user message to database
    const supabase = getSupabaseClient();
    const { data: savedMessage, error: saveError } = await supabase
      .from("customer_chat_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: userMessage,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving message:", saveError);
    }

    // Update session timestamp
    await supabase
      .from("customer_chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Get AI response
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

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "customer",
          messages: apiMessages,
          userId: user.id,
          customerId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.response || data.message || "I'm sorry, I couldn't process that request.";

      // Save AI response to database
      const { data: savedAiMessage } = await supabase
        .from("customer_chat_messages")
        .insert({
          session_id: sessionId,
          role: "assistant",
          content: aiMessage,
        })
        .select()
        .single();

      // Update messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          ...(savedMessage ? [savedMessage] : []),
          ...(savedAiMessage ? [savedAiMessage] : []),
        ];
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Assistant</h1>

      <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">👋 Hello! How can I help you today?</p>
              <p className="text-sm">Ask me about bookings, shops, or anything else!</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
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
                  {new Date(message.created_at).toLocaleTimeString()}
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

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || !sessionId}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !sessionId}
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

