// app/owner/messages/page.tsx
// Owner messages page - Customer messaging

"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

interface CustomerThread {
  id: string;
  session_id: string;
  shop_id: string;
  shop_name?: string;
  customer_email?: string;
  customer_name?: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  role?: string;
  sender_type?: 'customer' | 'owner';
  content: string;
  created_at: string;
}

export default function OwnerMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [customerThreads, setCustomerThreads] = useState<CustomerThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await loadCustomerThreads();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerThreads = async () => {
    if (!user?.id) return;
    try {
      console.log('[Owner Messages] 🔍 [DIAGNOSTIC] Loading conversations for owner:', user.id);
      // Use the new internal messaging endpoint for owner conversations
      const res = await fetch(`${apiUrl}/api/internal-messaging/owner/conversations`, {
        headers: { 'x-user-id': user.id },
      });
      
      console.log('[Owner Messages] 📥 [DIAGNOSTIC] Response status:', res.status, res.statusText);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Conversations loaded:', data.conversations?.length || 0);
        console.log('[Owner Messages] 📦 [DIAGNOSTIC] Conversations data:', data);
        
        // Load shop names for each conversation
        const conversationsWithShops = await Promise.all(
          (data.conversations || []).map(async (conv: any) => {
            try {
              const shopRes = await fetch(`${apiUrl}/shops/${conv.shop_id}`);
              if (shopRes.ok) {
                const shopData = await shopRes.json();
                return { ...conv, shop: { id: shopData.id, name: shopData.name } };
              }
            } catch (error) {
              console.error('[Owner Messages] Error loading shop:', error);
            }
            return conv;
          })
        );
        
        // Format conversations for customer messages
        const formattedThreads: CustomerThread[] = conversationsWithShops.map((conv: any) => ({
          id: conv.id,
          session_id: conv.id,
          shop_id: conv.shop_id,
          shop_name: conv.shop?.name,
          customer_name: conv.customer?.name || conv.customer_email || `${conv.customer_type} user`,
          customer_email: conv.customer?.email || null,
          lastMessageAt: conv.last_message_at || conv.created_at,
          unreadCount: conv.unread_count || 0,
        }));
        
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Formatted threads:', formattedThreads.length);
        setCustomerThreads(formattedThreads);
      } else {
        const errorText = await res.text();
        console.error('[Owner Messages] ❌ [DIAGNOSTIC] Failed to load customer conversations:', {
          status: res.status,
          statusText: res.statusText,
          error: errorText,
        });
        setCustomerThreads([]);
      }
    } catch (error) {
      console.error('[Owner Messages] ❌ [DIAGNOSTIC] Error loading customer threads:', error);
      setCustomerThreads([]);
    }
  };


  const loadMessages = async (conversationId: string) => {
    if (!user?.id) {
      console.error('[Owner Messages] ❌ [DIAGNOSTIC] Cannot load messages - missing user.id');
      return;
    }
    
    try {
      console.log('[Owner Messages] 🔍 [DIAGNOSTIC] Loading messages', {
        conversationId,
        userId: user.id,
        endpoint: `${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`,
      });
      
      // Use the new internal messaging endpoint
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[Owner Messages] 📥 [DIAGNOSTIC] Response received', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Messages loaded', {
          conversationId,
          messagesCount: data.messages?.length || 0,
          messages: data.messages,
        });
        
        // Format messages for display
        const formattedMessages: Message[] = (data.messages || []).map((msg: any) => {
          // Map sender_role to role and sender_type
          const isOwner = msg.sender_role === 'shop' || msg.sender_role === 'owner';
          const isAI = msg.sender_role === 'ai';
          
          return {
            id: msg.id,
            role: isOwner || isAI ? 'assistant' : 'user',
            sender_type: isOwner ? 'owner' : 'customer',
            content: msg.content || msg.body || '',
            created_at: msg.created_at,
          };
        });
        
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Formatted messages:', formattedMessages.length);
        setMessages(formattedMessages);
      } else {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : { error: 'Unknown error' };
        } catch {
          errorData = { error: errorText };
        }
        
        console.error('[Owner Messages] ❌ [DIAGNOSTIC] Failed to load messages', {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
          conversationId,
          userId: user.id,
        });
        setMessages([]);
      }
    } catch (error: any) {
      console.error('[Owner Messages] ❌ [DIAGNOSTIC] Error loading messages', {
        error,
        message: error.message,
        conversationId,
        userId: user.id,
      });
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedThread || sending || !user?.id) {
      console.warn('[Owner Messages] ⚠️ [DIAGNOSTIC] Cannot send message', {
        hasInput: !!input.trim(),
        selectedThread,
        sending,
        hasUserId: !!user?.id,
      });
      return;
    }

    const messageText = input.trim();
    setInput("");
    setSending(true);

    try {
      console.log('[Owner Messages] 📤 [DIAGNOSTIC] Sending message', {
        conversationId: selectedThread,
        userId: user.id,
        messageLength: messageText.length,
        endpoint: `${apiUrl}/api/internal-messaging/messages`,
      });
      
      // Use the new internal messaging endpoint
      const res = await fetch(`${apiUrl}/api/internal-messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          conversation_id: selectedThread,
          content: messageText,
        }),
      });
      
      console.log('[Owner Messages] 📥 [DIAGNOSTIC] Send message response', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Message sent successfully', data);
        
        // Reload messages to show the new message
        await loadMessages(selectedThread);
        // Refresh conversation list to update unread counts
        await loadCustomerThreads();
      } else {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : { error: 'Unknown error' };
        } catch {
          errorData = { error: errorText };
        }
        console.error('[Owner Messages] ❌ [DIAGNOSTIC] Failed to send message', {
          status: res.status,
          error: errorData,
          conversationId: selectedThread,
          userId: user.id,
        });
        alert(`${t('messages.failedToSend')}: ${errorData.error || t('common.error')}`);
      }
    } catch (error: any) {
      console.error('[Owner Messages] ❌ [DIAGNOSTIC] Error sending message', {
        error,
        message: error.message,
        conversationId: selectedThread,
        userId: user.id,
      });
      alert(`${t('messages.errorSending')}: ${error.message || t('common.error')}`);
    } finally {
      setSending(false);
    }
  };

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('messages.title')}</h1>


      <div className="flex gap-6 h-[calc(100vh-250px)]">
        {/* Threads List */}
        <div className="w-80 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {t('messages.customerConversations')}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {customerThreads.length > 0 ? (
              <div className="divide-y">
                {customerThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedThread === thread.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {thread.customer_name || thread.customer_email || t('messages.customer')}
                    </p>
                    {thread.shop_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        {thread.shop_name}
                      </p>
                    )}
                    {thread.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-gray-500">{t('messages.noConversations')}</p>
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
                  {customerThreads.find(t => t.id === selectedThread)?.customer_name || 
                   customerThreads.find(t => t.id === selectedThread)?.customer_email || 
                   t('messages.customer')}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {t('messages.noMessages')}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        (message.role === 'assistant' || message.sender_type === 'owner') 
                          ? 'justify-end' 
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          (message.role === 'assistant' || message.sender_type === 'owner')
                            ? 'bg-blue-600 text-white'
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
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('messages.typeMessage')}
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('chat.send')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {t('messages.selectConversation')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

