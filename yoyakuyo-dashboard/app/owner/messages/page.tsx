// app/owner/messages/page.tsx
// Owner messages page - Customer messaging

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/lib/useNotifications';

interface CustomerThread {
  id: string;
  session_id: string;
  shop_id: string;
  shop_name?: string;
  customer_email?: string;
  customer_name?: string;
  customer_role?: string;
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

function OwnerMessagesPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { notifications: ownerNotifications, markAsRead } = useNotifications('owner', user?.id || '');
  const [customerThreads, setCustomerThreads] = useState<CustomerThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(() => {
    // Try to restore selected conversation from localStorage or URL params
    if (typeof window !== 'undefined') {
      const urlConversationId = new URLSearchParams(window.location.search).get('conversation') ||
                               new URLSearchParams(window.location.search).get('conversationId') ||
                               new URLSearchParams(window.location.search).get('session');
      if (urlConversationId) {
        console.log('[Owner Messages] 🎯 Initializing with URL conversation:', urlConversationId);
        return urlConversationId;
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('selectedConversation');
      if (saved) {
        console.log('[Owner Messages] 💾 Initializing with saved conversation:', saved);
        return saved;
      }

      console.log('[Owner Messages] 🆕 Initializing with no conversation selected');
      return null;
    }
    return null;
  });
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

  // Handle conversation deep link (e.g., from notifications)
  useEffect(() => {
    const conversationId =
      searchParams.get('conversation') ||
      searchParams.get('conversationId') ||
      // Back-compat: older notifications used "session"
      searchParams.get('session');

    if (conversationId && conversationId !== selectedThread) {
      console.log('[Owner Messages] 🔗 URL param conversation selected:', conversationId);
      setSelectedThread(conversationId);
    } else if (!conversationId && selectedThread) {
      // If no URL param but we have a saved conversation, keep it
      console.log('[Owner Messages] 💾 Restored conversation from state/localStorage:', selectedThread);
    }
  }, [searchParams, selectedThread]);

  // Force refresh conversations on window focus (user returning to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && !loading) {
        console.log('[Owner Messages] 🔄 Window focused - refreshing conversations');
        loadCustomerThreads();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, loading]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
      // Save to localStorage for persistence across page refreshes
      localStorage.setItem('selectedConversation', selectedThread);
    } else {
      // Clear localStorage when no conversation is selected
      localStorage.removeItem('selectedConversation');
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
      console.log('[Owner Messages] ✅ Data loaded successfully');
    } catch (error) {
      console.error('[Owner Messages] ❌ Error loading data:', error);
      // Clear any stale state on error
      setCustomerThreads([]);
      setMessages([]);
      setSelectedThread(null);
      localStorage.removeItem('selectedConversation');
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
        
        // Sort conversations by last message time (most recent first)
        conversationsWithShops.sort((a: any, b: any) => {
          const aTime = new Date(a.last_message_at || a.created_at).getTime();
          const bTime = new Date(b.last_message_at || b.created_at).getTime();
          return bTime - aTime; // Most recent first
        });

        console.log('[Owner Messages] 📋 [DIAGNOSTIC] Conversations sorted by time, first 3:', conversationsWithShops.slice(0, 3).map(c => ({
          id: c.id,
          lastMessageAt: c.last_message_at,
          createdAt: c.created_at,
          customerName: c.customer?.name || 'Unknown'
        })));

        // Format conversations for customer messages
        const formattedThreads: CustomerThread[] = conversationsWithShops.map((conv: any) => {
          // Prioritize customer name, but if not available, extract name from email or use type
          let displayName: string;
          
          // First try: use customer name from API
          if (conv.customer?.name) {
            displayName = conv.customer.name;
          }
          // Second try: extract name from email
          else if (conv.customer?.email) {
            const emailName = conv.customer.email.split('@')[0];
            // Capitalize first letter and use as display name
            displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
          // Third try: use customer_type to generate generic label
          else if (conv.customer_type) {
            displayName = conv.customer_type === 'line' ? 'LINE Customer' : 
                          conv.customer_type === 'web' ? 'Web Customer' : 
                          'Guest';
          }
          // Final fallback
          else {
            displayName = 'Customer';
          }
          
          console.log(`[Owner Messages] Formatted thread ${conv.id}: customer_name="${displayName}", customer_email="${conv.customer?.email || 'null'}"`);
          
          return {
            id: conv.id,
            session_id: conv.id,
            shop_id: conv.shop_id,
            shop_name: conv.shop?.name,
            customer_name: displayName, // Always a string, never null
            customer_email: conv.customer?.email || undefined,
            customer_role: conv.customer?.role || conv.customer_type || undefined,
            lastMessageAt: conv.last_message_at || conv.created_at,
            unreadCount: conv.unread_count || 0,
          };
        });
        
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Formatted threads:', formattedThreads.length);
        console.log('[Owner Messages] 📋 [DIAGNOSTIC] Sample thread:', formattedThreads[0]);

        // Auto-select most recent conversation if none selected
        if (!selectedThread && formattedThreads.length > 0) {
          const mostRecentThread = formattedThreads[0];
          console.log('[Owner Messages] 🎯 Auto-selecting most recent conversation:', mostRecentThread.id);
          setSelectedThread(mostRecentThread.id);
        } else if (selectedThread && formattedThreads.length > 0) {
          // Verify selected conversation still exists
          const selectedExists = formattedThreads.some(t => t.id === selectedThread);
          if (!selectedExists) {
            console.log('[Owner Messages] ⚠️ Selected conversation no longer exists, auto-selecting most recent');
            setSelectedThread(formattedThreads[0].id);
          } else {
            console.log('[Owner Messages] ✅ Selected conversation still exists:', selectedThread);
          }
        }

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
        endpoint: `${apiUrl}/api/internal-messaging/${conversationId}/messages`,
      });
      
      // Use the new internal messaging endpoint
      const res = await fetch(`${apiUrl}/api/internal-messaging/${conversationId}/messages`, {
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
      
      if (res.ok || res.status === 304) {
        const data = await res.json();
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Messages loaded', {
          conversationId,
          messagesCount: data.messages?.length || 0,
          fromCache: res.status === 304,
          messages: data.messages,
        });

        // Format messages for display
        const formattedMessages: Message[] = (data.messages || []).map((msg: any) => {
          // Map sender_role to role and sender_type
          const isOwner = msg.sender_role === 'shop' || msg.sender_role === 'owner' || msg.sender_role === 'ai';

          console.log('[Owner Messages] 📝 Formatting message:', {
            id: msg.id,
            sender_role: msg.sender_role,
            sender_type: msg.sender_type,
            content_preview: (msg.content || msg.body || '').substring(0, 50),
            isOwner,
            final_role: isOwner ? 'assistant' : 'user',
            final_sender_type: isOwner ? 'owner' : 'customer'
          });

          return {
            id: msg.id,
            role: isOwner ? 'assistant' : 'user',
            sender_type: isOwner ? 'owner' : 'customer',
            content: msg.content || msg.body || '',
            created_at: msg.created_at,
          };
        });

        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Formatted messages:', formattedMessages.length);
        setMessages(formattedMessages);

        // Mark messages as read when conversation is opened (even from cache)
        console.log('[Owner Messages] 🚀 [DIAGNOSTIC] About to call markMessagesAsRead for conversation:', conversationId);
        console.log('[Owner Messages] 📊 [DIAGNOSTIC] Current user ID:', user?.id);
        console.log('[Owner Messages] 🔍 [DIAGNOSTIC] Calling markMessagesAsRead now...');

        try {
          console.log('[Owner Messages] 🎯 [DIAGNOSTIC] Inside try block, about to call markMessagesAsRead');
          const result = await markMessagesAsRead(conversationId);
          console.log('[Owner Messages] ✅ [DIAGNOSTIC] markMessagesAsRead completed with result:', result);
        } catch (error: unknown) {
          console.error('[Owner Messages] ❌ [DIAGNOSTIC] markMessagesAsRead threw error:', error);
          console.error('[Owner Messages] ❌ [DIAGNOSTIC] Error stack:', error instanceof Error ? error.stack : 'Unknown error');
        }

        // Force refresh conversation list after marking messages as read
        console.log('[Owner Messages] 🔄 [DIAGNOSTIC] Forcing conversation list refresh');
        try {
          await loadCustomerThreads();
          console.log('[Owner Messages] ✅ [DIAGNOSTIC] Conversation list refreshed');
        } catch (error) {
          console.error('[Owner Messages] ❌ [DIAGNOSTIC] Failed to refresh conversation list:', error);
        }
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

  const markMessagesAsRead = async (conversationId: string) => {
    console.log('[Owner Messages] 🎯 [DIAGNOSTIC] markMessagesAsRead function called with:', conversationId);

    if (!user?.id) {
      console.error('[Owner Messages] ❌ Cannot mark messages as read - missing user.id');
      return;
    }

    try {
      console.log('[Owner Messages] 📖 [DIAGNOSTIC] Marking messages as read', {
        conversationId,
        userId: user.id,
        endpoint: `${apiUrl}/api/internal-messaging/${conversationId}/mark-read`,
      });

      const res = await fetch(`${apiUrl}/api/internal-messaging/${conversationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Owner Messages] 📥 [DIAGNOSTIC] Mark read response details', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        url: res.url,
        headers: Object.fromEntries(res.headers.entries()),
      });

      // Log the response body if available
      let responseBody;
      try {
        responseBody = await res.clone().json();
        console.log('[Owner Messages] 📄 [DIAGNOSTIC] Mark read response body:', responseBody);
      } catch (e) {
        console.log('[Owner Messages] 📄 [DIAGNOSTIC] Mark read response has no JSON body');
      }

      if (res.ok) {
        console.log('[Owner Messages] ✅ [DIAGNOSTIC] Messages marked as read successfully');

        // Mark corresponding notifications as read
        const relatedNotifications = ownerNotifications.filter(
          (n) => n.type === 'new_message' && n.data?.conversation_id === conversationId && !n.is_read
        );

        console.log('[Owner Messages] 📧 [DIAGNOSTIC] Found related notifications to mark as read:', relatedNotifications.length);
        console.log('[Owner Messages] 📧 [DIAGNOSTIC] All owner notifications:', ownerNotifications.map(n => ({
          id: n.id,
          type: n.type,
          conversation_id: n.data?.conversation_id,
          is_read: n.is_read,
          recipient_id: n.recipient_id
        })));

        // Mark each notification as read
        for (const notification of relatedNotifications) {
          try {
            console.log('[Owner Messages] 🔄 [DIAGNOSTIC] Attempting to mark notification as read:', notification.id);
            await markAsRead(notification.id);
            console.log('[Owner Messages] ✅ [DIAGNOSTIC] Marked notification as read:', notification.id);
          } catch (error) {
            console.error('[Owner Messages] ❌ [DIAGNOSTIC] Failed to mark notification as read:', notification.id, error);
          }
        }

        // Refresh conversation list to update unread counts
        console.log('[Owner Messages] 🔄 [DIAGNOSTIC] Refreshing conversation list after marking messages as read');
        await loadCustomerThreads();
      } else {
        const errorText = await res.text();
        console.error('[Owner Messages] ❌ [DIAGNOSTIC] Failed to mark messages as read', {
          status: res.status,
          error: errorText,
          conversationId,
          userId: user.id,
        });
      }
    } catch (error: any) {
      console.error('[Owner Messages] ❌ [DIAGNOSTIC] Error marking messages as read', {
        error,
        message: error.message,
        conversationId,
        userId: user.id,
      });
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
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">
                {t('messages.customerConversations')}
              </h2>
              <button
                onClick={() => {
                  console.log('[Owner Messages] 🔄 Manual refresh triggered');
                  loadCustomerThreads();
                }}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh conversations"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
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
                      {thread.customer_name || t('messages.customer')}
                    </p>
                    {thread.customer_role && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                        thread.customer_role === 'web' ? 'bg-purple-100 text-purple-700' :
                        thread.customer_role === 'line' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {thread.customer_role === 'web' ? 'Web' :
                         thread.customer_role === 'line' ? 'LINE' :
                         thread.customer_role === 'guest' ? 'Guest' : thread.customer_role}
                      </span>
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

export default function OwnerMessagesPage() {
  // Wrap content in Suspense so static prerender (next export) won't fail due to useSearchParams().
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      <OwnerMessagesPageContent />
    </Suspense>
  );
}

