// app/components/owner/MessagesPanel.tsx
// Slide-out messages panel for owner dashboard

"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";

interface Conversation {
  id: string;
  shop_id: string;
  booking_id?: string | null;
  customer_type: 'line' | 'web' | 'guest';
  customer_ref: string;
  unread_count: number;
  last_message_at: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_role: 'customer' | 'shop' | 'ai' | 'admin';
  sender_type: 'customer' | 'shop' | 'ai' | 'admin';
  body?: string;
  content?: string;
  created_at: string;
  is_read: boolean;
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialBookingId?: string | null;
}

export function MessagesPanel({ isOpen, onClose, initialBookingId }: MessagesPanelProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load conversations when panel opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  // Handle initialBookingId - find or create conversation for this booking
  useEffect(() => {
    if (initialBookingId && user && isOpen && !selectedConversationId) {
      loadConversationForBooking(initialBookingId);
    }
  }, [initialBookingId, user, isOpen]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && isOpen) {
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
  }, [selectedConversationId, isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle escape key to close panel
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Focus the panel for accessibility
      const firstFocusable = panelRef.current.querySelector('button, input, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversationForBooking = async (bookingId: string) => {
    if (!user?.id) return;

    try {
      // Find conversation by booking_id
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations?booking_id=${bookingId}`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSelectedConversationId(data[0].id);
          await loadConversations(); // Refresh conversation list
        }
      }
    } catch (error) {
      console.error("Error loading conversation for booking:", error);
    }
  };

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Get conversations for shop owner - filter by conversation_type=booking_owner
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations?conversation_type=booking_owner`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
      } else {
        console.error("Failed to load conversations:", res.status, await res.text());
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${apiUrl}/api/internal-messaging/${conversationId}/messages`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        // API returns { messages: [...] }
        setMessages(data.messages || data || []);
      } else {
        console.error("Failed to load messages:", res.status, await res.text());
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const supabase = getSupabaseClient();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`conversation-${conversationId}`)
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
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversationId || sending) return;

    const content = input.trim();
    // Don't clear input immediately - wait for success
    setSending(true);

    try {
      const res = await fetch(`${apiUrl}/api/internal-messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          conversation_id: selectedConversationId,
          content: content,
        }),
      });

      if (res.ok) {
        // Clear input only after successful send
        setInput("");
        await loadMessages(selectedConversationId);
        await loadConversations(); // Refresh conversation list
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to send message');
        // Don't restore input - let user keep typing
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message');
      // Don't restore input - let user keep typing
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[40%] lg:w-[35%] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="messages-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 id="messages-panel-title" className="text-xl font-bold text-gray-900">
            {t('messages.title') || 'Messages'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close messages panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Threads List */}
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{t('messages.conversations') || 'Conversations'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {t('messages.loading') || 'Loading...'}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {t('messages.noConversations') || 'No conversations yet'}
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conversation.shop?.name || t('messages.customer') || 'Customer'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.customer_type === 'line' ? 'LINE Customer' : 
                           conversation.customer_type === 'web' ? 'Web Customer' : 
                           'Guest Customer'}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-1">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conversation.last_message_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages View */}
          <div className="flex-1 bg-white flex flex-col min-w-0">
            {selectedConversationId ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation?.shop?.name || t('messages.customer') || 'Customer'}
                  </h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {t('messages.noMessages') || 'No messages yet. Start the conversation!'}
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Determine if message is from owner (shop) or customer
                      const isOwnerMessage = message.sender_role === 'shop' || message.sender_type === 'shop' || message.sender_role === 'admin';
                      const isAIMessage = message.sender_role === 'ai' || message.sender_type === 'ai';
                      const messageContent = message.content || message.body || '';
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnerMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isOwnerMessage
                                ? 'bg-blue-600 text-white'
                                : isAIMessage
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{messageContent}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
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
    </>
  );
}

