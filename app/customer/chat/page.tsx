"use client";

import { useEffect, useState, useRef } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";
import { useBrowseAIContext } from "@/app/components/BrowseAIContext";

export default function CustomerChatPage() {
  const { user, session } = useCustomAuth();
  const browseContext = useBrowseAIContext();
  const shopContext = browseContext?.shopContext;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      initializeSession();
    }
  }, [user]);

  useEffect(() => {
    if (sessionId) {
      loadHistory();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    
    // First, get or create customer_profile
    let profileId: string | null = null;
    
    // Try to find existing profile
    const { data: customerProfile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", user.id)
      .maybeSingle();

    if (customerProfile) {
      profileId = customerProfile.id;
    } else {
      // Profile doesn't exist - create it
      console.log("Creating customer profile for chat session...");
      const { data: newProfile, error: profileError } = await supabase
        .from("customer_profiles")
        .insert({
          id: user.id, // Use customer.id as profile.id
          customer_auth_id: user.id,
          email: user.email || '',
          name: user.name || user.email?.split('@')[0] || 'Customer',
        })
        .select("id")
        .single();

      if (profileError) {
        console.error("Error creating customer profile:", profileError);
        // If insert fails, try using user.id directly
        profileId = user.id;
      } else if (newProfile) {
        profileId = newProfile.id;
      } else {
        // Fallback to user.id
        profileId = user.id;
      }
    }
    
    if (!profileId) {
      console.error("Could not determine profile ID");
      return;
    }
    
    // Get or create ai_chat_session (use ai_chat_sessions table)
    // Use shopId from shop context if available, otherwise use placeholder
    const shopIdForSession = shopContext?.shopId || '00000000-0000-0000-0000-000000000000';
    
    const { data: existingSession } = await supabase
      .from("ai_chat_sessions")
      .select("id")
      .eq("customerId", profileId)
      .eq("shopId", shopIdForSession)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      setSessionId(existingSession.id);
    } else {
      // Create new session
      const { data: newSession, error } = await supabase
        .from("ai_chat_sessions")
        .insert({
          customerId: profileId,
          shopId: shopIdForSession,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating ai_chat_session:", error);
        // Even if session creation fails, allow chat to work with a temporary session
        const tempSessionId = `temp-${user.id}-${Date.now()}`;
        setSessionId(tempSessionId);
      } else if (newSession) {
        setSessionId(newSession.id);
      }
    }
  };

  const loadHistory = async () => {
    if (!sessionId || sessionId.startsWith('temp-')) return;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("sessionId", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading chat history from ai_messages:", error);
    } else if (data) {
      // Convert ai_messages format to expected format
      const convertedMessages = data.map((msg: any) => ({
        id: msg.id,
        session_id: msg.sessionId,
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message,
        created_at: msg.created_at,
      }));
      setMessages(convertedMessages);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    // If no sessionId yet, try to initialize it first
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      await initializeSession();
      // Wait a bit for session to be set
      await new Promise(resolve => setTimeout(resolve, 300));
      // Re-check sessionId after initialization
      if (!sessionId) {
        // Create a temporary session ID for this message
        currentSessionId = `temp-${user.id}-${Date.now()}`;
        setSessionId(currentSessionId);
      } else {
        currentSessionId = sessionId;
      }
    }

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message to UI
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      session_id: currentSessionId,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Save user message to database (only if not a temp session)
    let savedMessage = null;
    if (currentSessionId && !currentSessionId.startsWith('temp-')) {
      const supabase = getSupabaseClient();
      const { data: saved, error: saveError } = await supabase
        .from("ai_messages")
        .insert({
          sessionId: currentSessionId,
          sender: "user",
          message: userMessage,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving message to ai_messages:", saveError);
      } else {
        // Convert to expected format
        savedMessage = {
          id: saved.id,
          session_id: saved.sessionId,
          role: "user",
          content: saved.message,
          created_at: saved.created_at,
        };
      }
    }

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

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (session?.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
      }

      // Get customer profile to pass to AI
      const supabaseForProfile = getSupabaseClient();
      const { data: customerProfile } = await supabaseForProfile
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

      // Save AI response to database (only if not a temp session)
      let savedAiMessage = null;
      if (currentSessionId && !currentSessionId.startsWith('temp-')) {
        const supabase = getSupabaseClient();
        const { data: saved } = await supabase
          .from("ai_messages")
          .insert({
            sessionId: currentSessionId,
            sender: "ai",
            message: aiMessage,
          })
          .select()
          .single();
        
        if (saved) {
          // Convert to expected format
          savedAiMessage = {
            id: saved.id,
            session_id: saved.sessionId,
            role: "assistant",
            content: saved.message,
            created_at: saved.created_at,
          };
        }
      }

      // Update messages - add AI response
      const aiResponseMessage = {
        id: `ai-${Date.now()}`,
        session_id: currentSessionId,
        role: "assistant",
        content: aiMessage,
        created_at: new Date().toISOString(),
      };
      
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          savedMessage || tempUserMessage, // Use saved message or temp message
          savedAiMessage || aiResponseMessage, // Use saved AI message or temp AI message
        ];
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    if (!user) return;
    
    const supabase = getSupabaseClient();
    
    // Get customer profile
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("customer_auth_id", user.id)
      .maybeSingle();
    
    if (profile) {
      // Create new session in ai_chat_sessions
      const shopIdForSession = shopContext?.shopId || '00000000-0000-0000-0000-000000000000';
      const { data: newSession, error } = await supabase
        .from("ai_chat_sessions")
        .insert({ 
          customerId: profile.id,
          shopId: shopIdForSession,
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating new chat session:", error);
      } else if (newSession) {
        setSessionId(newSession.id);
        setMessages([]);
      }
    }
  };

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
              placeholder={sessionId ? "Type your message..." : "Initializing chat..."}
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

