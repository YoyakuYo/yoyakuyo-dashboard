"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for realtime
// PART 4: Realtime subscription for live message updates
let supabase: ReturnType<typeof createClient> | null = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('[Messages] Supabase env vars not configured, realtime disabled');
  }
} catch (error) {
  console.error('[Messages] Failed to initialize Supabase client:', error);
}

interface Message {
  id: string;
  conversation_id: string;
  sender_role?: 'customer' | 'shop' | 'ai';
  sender_type: 'customer' | 'shop';
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shop_id');
  const bookingId = searchParams.get('booking_id');
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!shopId) {
      alert('Shop ID is required');
      return;
    }

    // Get LINE user ID and ID token
    const initLIFF = async () => {
      if (typeof window !== "undefined" && window.liff) {
        try {
          const profile = await window.liff.getProfile();
          const token = await window.liff.getIDToken();
          setLineUserId(profile.userId);
          setIdToken(token);
          
          // Create or get conversation
          await createOrGetConversation(profile.userId, token);
        } catch (error) {
          console.error("[Messages] Failed to initialize LIFF:", error);
          alert('Failed to initialize. Please try again.');
        }
      }
    };

    initLIFF();
  }, [shopId, bookingId]);

  const createOrGetConversation = async (lineUserId: string, token: string) => {
    try {
      setLoading(true);
      
      // Create or get conversation
      const convRes = await fetch(`${apiUrl}/api/internal-messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-user-id': lineUserId,
          'x-id-token': token,
        },
        body: JSON.stringify({
          shop_id: shopId,
          booking_id: bookingId || null,
          customer_type: 'line',
          customer_ref: lineUserId,
        }),
      });

      if (!convRes.ok) {
        const errorData = await convRes.json().catch(() => ({ error: 'Failed to create conversation' }));
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const convData = await convRes.json();
      const convId = convData.conversation_id;
      setConversationId(convId);

      // Load messages
      await loadMessages(convId, lineUserId, token);
      
      // PART 4: Subscribe to realtime updates
      subscribeToMessages(convId);
    } catch (error: any) {
      console.error("[Messages] Error creating/getting conversation:", error);
      alert(`Error: ${error.message || 'Failed to initialize conversation'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string, lineUserId: string, token: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations/${convId}/messages`, {
        headers: {
          'x-line-user-id': lineUserId,
          'x-id-token': token,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await res.json();
      setMessages(data.messages || []);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("[Messages] Error loading messages:", error);
    }
  };

  // PART 4: Subscribe to realtime updates
  const subscribeToMessages = (convId: string) => {
    if (!supabase) {
      console.warn("[Messages] Supabase client not initialized, skipping realtime");
      return;
    }

    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    console.log("[Messages] Subscribing to realtime updates for conversation:", convId);
    
    const channel = supabase
      .channel(`messages:conversation_id=eq.${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          console.log("[Messages] New message received via realtime:", payload.new);
          const newMessage = payload.new as Message;
          
          // Add message to list (optimistic UI reconciliation)
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              sender_role: (newMessage as any).sender_role || (newMessage.sender_type === 'shop' ? 'shop' : 'customer'),
              sender_type: newMessage.sender_type,
              body: newMessage.body,
              is_read: newMessage.is_read,
              created_at: newMessage.created_at,
            }];
          });
          
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  };

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current && supabase) {
        console.log("[Messages] Cleaning up realtime subscription");
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    // Block send if content is empty or whitespace
    if (!newMessage || !newMessage.trim() || !conversationId || !lineUserId || !idToken || sending) {
      if (!newMessage || !newMessage.trim()) {
        console.warn("[Messages] Cannot send empty message");
      }
      return;
    }

    try {
      setSending(true);
      const trimmedContent = newMessage.trim();
      console.log("[Messages] Sending message:", {
        conversation_id: conversationId,
        contentLength: trimmedContent.length,
      });
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-user-id': lineUserId,
          'x-id-token': idToken,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: trimmedContent, // Send as 'content' not 'body'
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await res.json();
      
      // PART 4: Optimistic UI - add message immediately
      // Realtime will also add it, but we add it here for instant feedback
      setMessages((prev) => {
        // Check if message already exists (realtime might have added it)
        if (prev.some((msg) => msg.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error("[Messages] Error sending message:", error);
      alert(`Error: ${error.message || 'Failed to send message'}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const senderRole = message.sender_role || (message.sender_type === 'shop' ? 'shop' : 'customer');
            const isCustomer = senderRole === 'customer';
            const isAI = senderRole === 'ai';
            
            return (
              <div
                key={message.id}
                className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCustomer
                      ? 'bg-green-600 text-white'
                      : isAI
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {isAI && (
                    <p className="text-xs font-semibold text-purple-700 mb-1">AI Assistant</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCustomer ? 'text-green-100' : isAI ? 'text-purple-600' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={sending || !conversationId}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim() || !conversationId}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

