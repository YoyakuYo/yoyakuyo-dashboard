"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { messagingFetch } from "@/app/lib/messagingApiClient";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for realtime
let supabase: ReturnType<typeof createClient> | null = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('[LINE Inbox] Supabase env vars not configured, realtime disabled');
  }
} catch (error) {
  console.error('[LINE Inbox] Failed to initialize Supabase client:', error);
}

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

interface Conversation {
  id: string;
  shop_id: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  };
  last_message_at?: string;
  created_at: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'shop';
  body?: string;
  content?: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed'; // STEP 1: Optimistic message status
}

function LineInboxPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShopId = searchParams.get('shop_id');
  const preselectedBookingId = searchParams.get('booking_id');
  const preselectedLineUserId = searchParams.get('line_user_id');
  
  const [lineUserId, setLineUserId] = useState<string>("");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null); // STEP 5: Scroll management
  const realtimeChannelRef = useRef<any>(null); // STEP 3: Realtime subscription
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('line_app_language') || 'ja';
    }
    return 'ja';
  });

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail.language);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('lineAppLanguageChanged', handleLanguageChange as EventListener);
      return () => {
        window.removeEventListener('lineAppLanguageChanged', handleLanguageChange as EventListener);
      };
    }
  }, []);

  // Initialize LIFF and load conversations
  useEffect(() => {
    const initLIFF = async () => {
      if (typeof window === "undefined" || !window.liff) {
        setError("LINE app is not available");
        setLoading(false);
        return;
      }

      try {
        const profile = await window.liff.getProfile();
        const token = await window.liff.getIDToken();
        setLineUserId(profile.userId);
        setIdToken(token);
        
        // STEP 1: Verify LINE user ID matches (if provided)
        if (preselectedLineUserId && preselectedLineUserId !== profile.userId) {
          console.error("[LINE Inbox] ❌ LINE user ID mismatch:", {
            provided: preselectedLineUserId,
            actual: profile.userId,
          });
          setError('User authentication mismatch. Please try again.');
          setLoading(false);
          return;
        }
        
        // Load conversations
        await loadConversations(profile.userId, token);
        
        // STEP 2: If shop_id is preselected, resolve/create conversation with booking_id
        if (preselectedShopId) {
          await handlePreselectedShop(preselectedShopId, profile.userId, token, preselectedBookingId || undefined);
        }
      } catch (error: any) {
        console.error("[LINE Inbox] Failed to initialize:", error);
        setError(`Failed to initialize: ${error.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    initLIFF();
  }, [preselectedShopId]);

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('line_app_language') || 'ja';
      setLanguage(storedLang);
    }
  }, []);

  const loadConversations = async (lineUserId: string, token: string) => {
    try {
      setLoading(true);
      console.log("[LINE Inbox] Loading conversations for LINE user:", lineUserId);
      
      // ALWAYS inject X-User-Id via unified messaging API client
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations?customer_type=line&customer_ref=${lineUserId}`,
        {
          lineUserId,
          idToken: token,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to load conversations' }));
        throw new Error(errorData.error || 'Failed to load conversations');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Loaded conversations:", data.conversations?.length || 0);
      setConversations(data.conversations || []);
      
      // If no preselected shop, select first conversation if available
      if (!preselectedShopId && data.conversations && data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0]);
        await loadMessages(data.conversations[0].id, lineUserId, token);
      }
    } catch (error: any) {
      console.error("[LINE Inbox] Error loading conversations:", error);
      setError(`Failed to load conversations: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Resolve or create conversation with booking_id and conversation_ai_mode
  const handlePreselectedShop = async (shopId: string, lineUserId: string, token: string, bookingId?: string) => {
    try {
      console.log("[LINE Inbox] Handling preselected shop:", { shopId, bookingId });
      
      // STEP 2: Resolve or create conversation
      // Call get_or_create_conversation(user_id, shop_id)
      // ALWAYS inject X-User-Id via unified messaging API client
      const convRes = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations`,
        {
          method: 'POST',
          lineUserId,
          idToken: token,
          body: {
            shop_id: shopId,
            booking_id: bookingId || null,
            customer_type: 'line',
            customer_ref: lineUserId,
          },
        }
      );

      if (!convRes.ok) {
        const errorData = await convRes.json().catch(() => ({ error: 'Failed to resolve conversation' }));
        throw new Error(errorData.error || 'Failed to resolve conversation');
      }

      const convData = await convRes.json();
      const conversationId = convData.conversation_id;
      
      console.log("[LINE Inbox] ✅ Conversation resolved:", conversationId);
      
      // STEP 4: Get shop name from conversation.shop (returned by backend)
      // Backend now returns shop details in response
      const shop = convData.shop || convData.conversation?.shop;
      
      // STEP 4: Verify shop name is resolved
      if (!shop || !shop.name) {
        console.error("[LINE Inbox] ❌ Shop name is missing for conversation:", conversationId);
        setError('Shop information is incomplete. Cannot open conversation.');
        // STEP 6: Prevent silent failures - throw error
        throw new Error('Shop name is missing');
      }
      
      const conversation: Conversation = {
        id: conversationId,
        shop_id: shopId,
        shop: shop,
        created_at: convData.conversation?.created_at || new Date().toISOString(),
      };
      
      // Check if conversation already exists in list
      const existingIndex = conversations.findIndex(c => c.id === conversationId);
      if (existingIndex >= 0) {
        // Update existing
        setConversations(prev => {
          const updated = [...prev];
          updated[existingIndex] = conversation;
          return updated;
        });
      } else {
        // Add new
        setConversations(prev => [conversation, ...prev]);
      }
      
      setSelectedConversation(conversation);
      await loadMessages(conversationId, lineUserId, token);
      
      // Focus message input after a short delay
      setTimeout(() => {
        const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
        if (input) {
          input.focus();
        }
      }, 300);
    } catch (error: any) {
      console.error("[LINE Inbox] ❌ Error handling preselected shop:", error);
      setError(`Failed to open conversation: ${error.message || 'Unknown error'}`);
      // STEP 6: Prevent silent failures - throw error
      throw error;
    }
  };

  const loadMessages = async (conversationId: string, lineUserId: string, token: string) => {
    try {
      setLoadingMessages(true);
      console.log("[LINE Inbox] Loading messages for conversation:", conversationId);
      
      // ALWAYS inject X-User-Id via unified messaging API client
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`,
        {
          lineUserId,
          idToken: token,
        }
      );

      if (!res.ok) {
        if (res.status === 403) {
          setError('Not authorized to view messages. Please ensure you are logged in correctly.');
          // STEP 4: Keep current conversation_id, show error state instead
          // DO NOT reset messages or conversation
          return;
        } else if (res.status === 401) {
          setError('Authentication required. Please log in again.');
          // STEP 4: Keep current conversation_id, show error state instead
          return;
        }
        throw new Error('Failed to load messages');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Loaded messages:", data.messages?.length || 0);
      console.log("[LINE Inbox] Sample message:", data.messages?.[0]);
      
      // STEP 2: Merge results into state (do NOT overwrite) - preserve optimistic messages
      setMessages(prev => {
        // Keep messages with status 'sending' or 'failed' (optimistic messages)
        const optimisticMessages = prev.filter(m => m.status === 'sending' || m.status === 'failed');
        // Merge with fetched messages, avoiding duplicates
        const fetchedMessages = (data.messages || []).filter((newMsg: Message) => 
          !prev.some(existing => existing.id === newMsg.id)
        );
        return [...optimisticMessages, ...fetchedMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      
      setError(""); // Clear error on success
      
      // STEP 5: Auto-scroll to bottom after loading
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error("[LINE Inbox] Error loading messages:", error);
      setError(`Failed to load messages: ${error.message || 'Unknown error'}`);
      // STEP 4: Keep current conversation_id, show error state instead
      // DO NOT reset messages or conversation
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    // Block send if content is empty or whitespace
    if (!newMessage || !newMessage.trim() || !selectedConversation || !lineUserId || !idToken || sending) {
      if (!newMessage || !newMessage.trim()) {
        console.warn("[LINE Inbox] Cannot send empty message");
      }
      return;
    }

    const trimmedContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // STEP 1: Optimistic message insert - immediately append to local state
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_type: 'customer',
      content: trimmedContent,
      created_at: new Date().toISOString(),
      status: 'sending',
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    // STEP 5: Auto-scroll to bottom after optimistic insert
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      setSending(true);
      console.log("[LINE Inbox] Sending message to conversation:", selectedConversation.id, {
        contentLength: trimmedContent.length,
        tempId,
      });
      
      // ALWAYS inject X-User-Id via unified messaging API client
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/messages`,
        {
          method: 'POST',
          lineUserId,
          idToken,
          body: {
            conversation_id: selectedConversation.id,
            content: trimmedContent,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Message sent successfully:", data.message?.id);
      
      // STEP 2: Replace temp message with real message ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...data.message, status: 'sent' as const }
          : msg
      ));
      
      // STEP 5: Auto-scroll to bottom after real message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Reload conversations to update last_message_at
      if (lineUserId && idToken) {
        await loadConversations(lineUserId, idToken);
      }
    } catch (error: any) {
      console.error("[LINE Inbox] Error sending message:", error);
      
      // STEP 2: Mark message as failed, DO NOT reset conversation
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      
      setError(`Failed to send message: ${error.message || 'Unknown error'}`);
      // DO NOT alert - show error in UI instead
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    if (lineUserId && idToken) {
      await loadMessages(conv.id, lineUserId, idToken);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{language === 'ja' ? '読み込み中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{language === 'ja' ? '受信箱' : 'Inbox'}</h1>
            <button
              onClick={() => router.push("/line-app")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {language === 'ja' ? '戻る' : 'Back'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 py-2 flex-shrink-0">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 px-2 md:px-4 py-2">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="flex flex-1 min-h-0" style={{ height: '100%' }}>
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col min-w-0 hidden md:flex">
              <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <h2 className="font-semibold text-gray-900 text-sm">{language === 'ja' ? '会話' : 'Conversations'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">{language === 'ja' ? '会話がありません' : 'No conversations yet'}</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.shop?.name || 'Shop'}
                        </h3>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.last_message_at && (
                        <p className="text-xs text-gray-400">
                          {new Date(conv.last_message_at).toLocaleString()}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages View */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {selectedConversation ? (
                <>
                  <div className="p-3 border-b border-gray-200 flex-shrink-0">
                    <h2 className="font-semibold text-gray-900 text-sm">
                      {selectedConversation.shop?.name || 'Shop'}
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {loadingMessages ? (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm">{language === 'ja' ? 'メッセージを読み込み中...' : 'Loading messages...'}</p>
                      </div>
                    ) : error ? (
                      <div className="text-center text-red-600 mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-semibold">⚠️ {language === 'ja' ? 'エラー' : 'Error'}</p>
                        <p className="text-sm mt-2">{error}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <p>{language === 'ja' ? 'メッセージがありません。会話を始めましょう！' : 'No messages yet. Start the conversation!'}</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isCustomer = message.sender_type === 'customer';
                        const messageText = message.body || message.content || '';
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} min-w-0 w-full`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-md px-4 py-2 rounded-lg ${
                                isCustomer
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                              style={{
                                minWidth: 0,
                                width: 'fit-content',
                                maxWidth: '85%',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {messageText ? (
                                <p className={`text-sm break-words ${isCustomer ? 'text-white' : 'text-gray-900'}`}>
                                  {messageText}
                                </p>
                              ) : (
                                <p className={`text-xs italic ${isCustomer ? 'text-blue-100' : 'text-gray-400'}`}>
                                  (Empty message)
                                </p>
                              )}
                              <p
                                className={`text-xs mt-1 ${
                                  isCustomer ? 'text-blue-100' : 'text-gray-500'
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
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-gray-200 p-3 flex-shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={language === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm whitespace-nowrap"
                      >
                        {sending ? (language === 'ja' ? '送信中...' : 'Sending...') : (language === 'ja' ? '送信' : 'Send')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="text-lg">{language === 'ja' ? '会話を選択してください' : 'Select a conversation'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LineInboxPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LineInboxPageContent />
    </Suspense>
  );
}

