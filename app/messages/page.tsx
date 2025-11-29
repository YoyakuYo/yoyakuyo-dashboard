// app/messages/page.tsx
// Owner messages page - view and reply to customer messages

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

interface Thread {
  id: string;
  shopId: string;
  bookingId?: string | null;
  customerEmail?: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview?: string | null;
  lastMessageFrom?: string | null;
}

interface Message {
  id: string;
  thread_id: string;
  sender_type: 'customer' | 'owner' | 'ai';
  content: string;
  sender_id?: string | null;
  created_at: string;
  read_by_owner: boolean;
  read_by_customer: boolean;
}

function MessagesPageContent() {
  const { user } = useAuth();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  // Handle bookingId parameter - find or create thread for this booking
  useEffect(() => {
    if (bookingIdParam && user && !selectedThread) {
      loadThreadForBooking(bookingIdParam);
    }
  }, [bookingIdParam, user]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
      subscribeToMessages(selectedThread);
    }

    return () => {
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadThreadForBooking = async (bookingId: string) => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${apiUrl}/messages/booking/${bookingId}/thread`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const thread = await res.json();
        setSelectedThread(thread.id);
        await loadThreads(); // Refresh thread list
      }
    } catch (error) {
      console.error("Error loading thread for booking:", error);
    }
  };

  const loadThreads = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${apiUrl}/messages/owner/threads`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        setThreads(data || []);
      }
    } catch (error) {
      console.error("Error loading threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${apiUrl}/messages/thread/${threadId}`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToMessages = (threadId: string) => {
    const supabase = getSupabaseClient();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          loadMessages(threadId);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedThread || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${apiUrl}/messages/thread/${selectedThread}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          content,
          senderType: 'owner',
        }),
      });

      if (res.ok) {
        await loadMessages(selectedThread);
        await loadThreads(); // Refresh thread list
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to send message');
        setInput(content); // Restore input on error
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message');
      setInput(content); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const selectedThreadData = threads.find(t => t.id === selectedThread);

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('messages.title') || 'Messages'}</h1>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Threads List */}
        <div className="w-80 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">{t('messages.conversations') || 'Conversations'}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {t('messages.noConversations') || 'No conversations yet'}
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedThread === thread.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {thread.customerEmail || t('messages.customer') || 'Customer'}
                      </p>
                      {thread.lastMessagePreview && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {thread.lastMessagePreview}
                        </p>
                      )}
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-1">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(thread.lastMessageAt).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {selectedThreadData?.customerEmail || t('messages.customer') || 'Customer'}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t('messages.noMessages') || 'No messages yet. Start the conversation!'}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'owner' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_type === 'owner'
                            ? 'bg-blue-600 text-white'
                            : message.sender_type === 'ai'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
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
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}

