// app/customer/messages/page.tsx
// Customer messages page - view and send messages to shops using unified conversations system

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { messagingFetch } from "@/app/lib/messagingApiClient";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Conversation {
  id: string;
  type: string;
  shop_id: string | null;
  customer_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  is_support_ticket?: boolean;
  shop?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    email: string;
    full_name: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'owner';
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    display_name?: string;
  };
}

function CustomerMessagesPageContent() {
  const { user } = useCustomAuth();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const shopIdParam = searchParams.get('shopId');
  const bookingIdParam = searchParams.get('bookingId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Handle shopId parameter - find or create conversation for this shop
  useEffect(() => {
    if (shopIdParam && user && !loading) {
      console.log('[Customer Messages] shopIdParam effect triggered:', { shopIdParam, conversationsCount: conversations.length, loading });
      
      // First, check if conversation already exists in loaded conversations
      const existingConv = conversations.find(c => c.shop_id === shopIdParam);
      if (existingConv) {
        console.log('[Customer Messages] Found existing conversation in list:', existingConv.id);
        setSelectedConversationId(existingConv.id);
      } else {
        // Conversations loaded but not found - create it
        console.log('[Customer Messages] No conversation found, creating for shop:', shopIdParam);
        createConversationForShop(shopIdParam);
      }
    }
  }, [shopIdParam, user, conversations, loading]);

  // Handle bookingId parameter - find conversation created by booking trigger
  useEffect(() => {
    if (bookingIdParam && user && !selectedConversationId) {
      findConversationForBooking(bookingIdParam);
    }
  }, [bookingIdParam, user]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      subscribeToMessages(selectedConversationId);
    }

    return () => {
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const findConversationForBooking = async (bookingId: string) => {
    if (!user?.id) {
      console.log('[Customer Messages] findConversationForBooking: No user ID');
      return;
    }

    try {
      console.log('[Customer Messages] Finding conversation for booking:', bookingId);
      // Use customers/bookings API endpoint to get booking details (bypasses RLS)
      const res = await fetch(`${apiUrl}/customers/bookings`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        const { bookings } = await res.json();
        const booking = bookings?.find((b: any) => b.id === bookingId);
        
        if (booking?.shops?.id) {
          console.log('[Customer Messages] Found booking, shop_id:', booking.shops.id);
          // Use internal messaging API to find or create conversation
          await createConversationForShop(booking.shops.id);
        } else {
          console.warn('[Customer Messages] Booking not found or no shop_id:', bookingId);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('[Customer Messages] Could not fetch bookings:', res.status, errorData);
      }
    } catch (error) {
      console.error("[Customer Messages] Error finding conversation for booking:", error);
      // Don't throw - this is a non-critical feature
    }
  };

  const createConversationForShop = async (shopId: string) => {
    if (!user?.id) {
      console.error('[Customer Messages] Cannot create conversation: user.id is missing');
      return;
    }

    try {
      console.log('[Customer Messages] Creating conversation for shop:', shopId, 'user:', user.id);
      // Use internal messaging API (same as LINE customers) for consistency
      // This API handles web customers automatically via x-user-id header
      // Note: customer_type and customer_ref are determined by the backend from x-user-id
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations`,
        {
          method: 'POST',
          userId: user.id,
          body: {
            shop_id: shopId,
            // Don't pass customer_type/customer_ref - backend determines from x-user-id
          },
        }
      );

      console.log('[Customer Messages] Create conversation response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('[Customer Messages] Create conversation response:', data);
        const conversationId = data.conversation_id || data.conversation?.id;
        if (conversationId) {
          console.log('[Customer Messages] ✅ Conversation created:', conversationId);
          setSelectedConversationId(conversationId);
          await loadConversations(); // Refresh conversation list
        } else {
          console.error("[Customer Messages] ❌ No conversation_id in response:", data);
          alert('Failed to create conversation: Invalid response');
        }
      } else {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("[Customer Messages] ❌ Failed to create conversation:", res.status, error);
        alert(error.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error("[Customer Messages] ❌ Error creating conversation:", error);
      alert('Failed to create conversation');
    }
  };

  const loadConversations = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('[Customer Messages] Loading conversations for user:', user.id);
      // Use internal messaging API (same as LINE customers) for consistency
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations`,
        {
          userId: user.id,
        }
      );

      if (res.ok) {
        const { conversations: convs } = await res.json();
        console.log('[Customer Messages] Loaded conversations:', convs?.length || 0, convs);
        setConversations(convs || []);
        
        // After loading conversations, check if we need to select one for shopIdParam
        // Note: Don't create conversation here - let the shopIdParam useEffect handle it
        // This prevents duplicate creation attempts
        if (shopIdParam) {
          const existingConv = (convs || []).find((c: Conversation) => c.shop_id === shopIdParam);
          if (existingConv) {
            console.log('[Customer Messages] Found existing conversation for shop:', shopIdParam, existingConv.id);
            setSelectedConversationId(existingConv.id);
          }
          // If not found, the shopIdParam useEffect will create it after loading completes
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("[Customer Messages] Failed to load conversations:", res.status, errorData);
      }
    } catch (error) {
      console.error("[Customer Messages] Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      // Use internal messaging API (same as LINE customers) for consistency
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`,
        {
          userId: user.id,
        }
      );

      if (res.ok) {
        const { messages: msgs } = await res.json();
        setMessages(msgs || []);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to load messages:", res.status, errorData);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const supabase = getSupabaseClient();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`customer-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages(conversationId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages(conversationId);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversationId || sending || !user?.id) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      // Use internal messaging API (same as LINE customers) for consistency
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/messages`,
        {
          method: 'POST',
          userId: user.id,
          body: {
            conversation_id: selectedConversationId,
            content,
          },
        }
      );

      if (res.ok) {
        const { message } = await res.json();
        // Add message optimistically
        setMessages(prev => [...prev, message]);
        await loadConversations(); // Refresh conversation list to update updated_at
      } else {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to send message:", res.status, error);
        alert(error.error || 'Failed to send message');
        setInput(content);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (loading) {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('customer.nav.messages') || 'Messages'}</h1>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="w-80 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">{t('messages.conversations') || 'Conversations'}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {t('messages.noConversations') || 'No conversations yet'}
                <br />
                <Link href="/customer/shops" className="text-blue-600 hover:underline mt-2 inline-block">
                  {t('messages.browseShops') || 'Browse shops to start messaging'}
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                // Get last message preview
                const lastMessage = messages
                  .filter(m => m.conversation_id === conv.id)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedConversationId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conv.is_support_ticket && !conv.shop_id
                            ? (t('customer.support.adminSupport') || 'Admin Support')
                            : conv.shop?.name || 'Shop'}
                        </p>
                        {lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {lastMessage.content.substring(0, 50)}
                            {lastMessage.content.length > 50 ? '...' : ''}
                          </p>
                        )}
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-1">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const dateStr = conv.updated_at || conv.created_at;
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                      })()}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          {selectedConversationId ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {selectedConversation?.is_support_ticket && !selectedConversation?.shop_id
                    ? (t('customer.support.adminSupport') || 'Admin Support')
                    : selectedConversation?.shop?.name || t('messages.shop') || 'Shop'}
                </h2>
                {selectedConversation?.owner && (
                  <p className="text-sm text-gray-600">
                    {selectedConversation.owner.full_name || selectedConversation.owner.email}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t('messages.noMessages') || 'No messages yet. Start the conversation!'}
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCustomer = message.sender_role === 'customer';
                    const displayName = message.sender?.full_name || 
                                      message.sender?.email || 
                                      (isCustomer ? 'You' : 'Shop Owner');

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isCustomer
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          {!isCustomer && (
                            <p className="text-xs font-semibold mb-1 text-gray-600">{displayName}</p>
                          )}
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isCustomer ? 'opacity-70' : 'text-gray-500'}`}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('messages.typeMessage') || 'Type a message...'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? t('messages.sending') || 'Sending...' : t('messages.send') || 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {t('messages.selectConversation') || 'Select a conversation to start messaging'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerMessagesPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <CustomerMessagesPageContent />
    </Suspense>
  );
}
