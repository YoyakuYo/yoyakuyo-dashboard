"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

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
  body: string;
  created_at: string;
}

function LineInboxPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShopId = searchParams.get('shop_id');
  
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
        
        // Load conversations
        await loadConversations(profile.userId, token);
        
        // If shop_id is preselected, find or create conversation
        if (preselectedShopId) {
          await handlePreselectedShop(preselectedShopId, profile.userId, token);
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
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations?customer_type=line&customer_ref=${lineUserId}`, {
        headers: {
          'x-line-user-id': lineUserId,
          'x-id-token': token,
        },
      });

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

  const handlePreselectedShop = async (shopId: string, lineUserId: string, token: string) => {
    try {
      console.log("[LINE Inbox] Handling preselected shop:", shopId);
      
      // Find existing conversation for this shop
      const existingConv = conversations.find(c => c.shop_id === shopId);
      
      if (existingConv) {
        console.log("[LINE Inbox] Found existing conversation:", existingConv.id);
        setSelectedConversation(existingConv);
        await loadMessages(existingConv.id, lineUserId, token);
      } else {
        // Create new conversation
        console.log("[LINE Inbox] Creating new conversation for shop:", shopId);
        const convRes = await fetch(`${apiUrl}/api/internal-messaging/conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-line-user-id': lineUserId,
            'x-id-token': token,
          },
          body: JSON.stringify({
            shop_id: shopId,
            customer_type: 'line',
            customer_ref: lineUserId,
          }),
        });

        if (!convRes.ok) {
          const errorData = await convRes.json().catch(() => ({ error: 'Failed to create conversation' }));
          throw new Error(errorData.error || 'Failed to create conversation');
        }

        const convData = await convRes.json();
        const newConv = {
          id: convData.conversation_id,
          shop_id: shopId,
          shop: convData.shop || { id: shopId, name: 'Shop' },
          created_at: new Date().toISOString(),
        };
        
        setSelectedConversation(newConv);
        setConversations(prev => [newConv, ...prev]);
        
        // Focus message input after a short delay
        setTimeout(() => {
          const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
          if (input) {
            input.focus();
          }
        }, 300);
      }
    } catch (error: any) {
      console.error("[LINE Inbox] Error handling preselected shop:", error);
      setError(`Failed to open conversation: ${error.message || 'Unknown error'}`);
    }
  };

  const loadMessages = async (conversationId: string, lineUserId: string, token: string) => {
    try {
      setLoadingMessages(true);
      console.log("[LINE Inbox] Loading messages for conversation:", conversationId);
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`, {
        headers: {
          'x-line-user-id': lineUserId,
          'x-id-token': token,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Loaded messages:", data.messages?.length || 0);
      setMessages(data.messages || []);
    } catch (error: any) {
      console.error("[LINE Inbox] Error loading messages:", error);
      setError(`Failed to load messages: ${error.message || 'Unknown error'}`);
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

    try {
      setSending(true);
      const trimmedContent = newMessage.trim();
      console.log("[LINE Inbox] Sending message to conversation:", selectedConversation.id, {
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
          conversation_id: selectedConversation.id,
          content: trimmedContent, // Send as 'content' not 'body'
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Message sent successfully:", data.message?.id);
      
      // Add message to list
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      
      // Reload conversations to update last_message_at
      if (lineUserId && idToken) {
        await loadConversations(lineUserId, idToken);
      }
    } catch (error: any) {
      console.error("[LINE Inbox] Error sending message:", error);
      setError(`Failed to send message: ${error.message || 'Unknown error'}`);
      alert(`Failed to send message: ${error.message || 'Unknown error'}`);
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">{language === 'ja' ? '会話' : 'Conversations'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
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
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.shop?.name || 'Shop'}
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm">{language === 'ja' ? 'メッセージを読み込み中...' : 'Loading messages...'}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <p>{language === 'ja' ? 'メッセージがありません。会話を始めましょう！' : 'No messages yet. Start the conversation!'}</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isCustomer = message.sender_type === 'customer';
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isCustomer
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
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
                  <div className="border-t border-gray-200 p-4">
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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

