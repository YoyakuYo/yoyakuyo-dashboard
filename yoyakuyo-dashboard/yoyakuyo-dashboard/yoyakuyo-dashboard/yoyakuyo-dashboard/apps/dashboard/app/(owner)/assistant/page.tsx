// apps/dashboard/app/(owner)/assistant/page.tsx
// AI Assistant page for shop owners with customer message threads

"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

interface Thread {
  id: string;
  shopId: string;
  bookingId: string | null;
  customerEmail: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageFrom: string | null;
  ownerTakenOver?: boolean;
}

interface ChatMessage {
  id: string;
  senderType: 'customer' | 'owner' | 'ai';
  content: string;
  createdAt: string;
  readByOwner: boolean;
  readByCustomer: boolean;
  senderId?: string | null;
  originalContent?: string; // Original content before translation (for owner messages)
  translatedContent?: string; // Translated content (for customer/AI messages)
}

export default function AssistantPage() {
  const { user } = useAuth();
  const t = useTranslations();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerTakenOver, setOwnerTakenOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());
  const [ownerPreferredLanguage, setOwnerPreferredLanguage] = useState<string>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load threads and owner preferences on mount
  useEffect(() => {
    if (user?.id) {
      loadThreads();
      loadOwnerPreferences();
    }
  }, [user]);

  const loadOwnerPreferences = async () => {
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOwnerPreferredLanguage(data.preferredLanguage || 'en');
      }
    } catch (error) {
      console.error('Error loading owner preferences:', error);
    }
  };

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThreadId) {
      loadMessages(selectedThreadId);
      subscribeToMessages(selectedThreadId);
      markAsRead(selectedThreadId);
    }

    // Cleanup subscription on thread change
    return () => {
      if (subscriptionRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [selectedThreadId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  const loadThreads = async () => {
    try {
      setLoadingThreads(true);
      const res = await fetch(`${apiUrl}/messages/owner/threads`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setThreads(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load threads');
        setThreads([]);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`${apiUrl}/messages/thread/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        const messagesData = Array.isArray(data) ? data : [];
        
        // Load takeover status
        const thread = threads.find(t => t.id === threadId);
        if (thread) {
          setOwnerTakenOver(thread.ownerTakenOver || false);
        }
        
        // Translate customer/AI messages to owner's preferred language
        const translatedMessages = await Promise.all(
          messagesData.map(async (msg: ChatMessage) => {
            if (msg.senderType === 'owner') {
              // Owner messages: use originalContent if available
              return {
                ...msg,
                originalContent: msg.originalContent || msg.content,
                translatedContent: msg.content, // Owner's message is already in their language
              };
            } else if (msg.senderType === 'customer' || msg.senderType === 'ai') {
              // Detect message language and translate to owner's preferred language if needed
              // Simple heuristic to detect if message is already in owner's language
              const needsTranslation = msg.content && !msg.translatedContent;
              
              if (needsTranslation) {
                try {
                  const translateRes = await fetch(`${apiUrl}/ai/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      text: msg.content,
                      targetLanguage: ownerPreferredLanguage,
                      sourceLanguage: 'auto', // Auto-detect source language
                    }),
                  });
                  
                  if (translateRes.ok) {
                    const translateData = await translateRes.json();
                    return {
                      ...msg,
                      originalContent: msg.content,
                      translatedContent: translateData.translatedText || msg.content,
                      detectedLanguage: translateData.sourceLanguage,
                    };
                  }
                } catch (translateError) {
                  console.error('Error translating message:', translateError);
                }
              }
              
              return {
                ...msg,
                originalContent: msg.content,
                translatedContent: msg.translatedContent || msg.content,
              };
            }
            return msg;
          })
        );
        
        setMessages(translatedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };
  
  const toggleTakeover = async () => {
    if (!selectedThreadId) return;
    
    const newTakenOver = !ownerTakenOver;
    setOwnerTakenOver(newTakenOver);
    
    try {
      const res = await fetch(`${apiUrl}/messages/thread/${selectedThreadId}/takeover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ takenOver: newTakenOver }),
      });
      
      if (!res.ok) {
        // Revert on error
        setOwnerTakenOver(!newTakenOver);
        console.error('Failed to toggle takeover');
      } else {
        // Update thread in list
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === selectedThreadId
              ? { ...thread, ownerTakenOver: newTakenOver }
              : thread
          )
        );
      }
    } catch (error) {
      console.error('Error toggling takeover:', error);
      setOwnerTakenOver(!newTakenOver);
    }
  };

  const markAsRead = async (threadId: string) => {
    try {
      await fetch(`${apiUrl}/messages/thread/${threadId}/mark-read-owner`, {
        method: 'POST',
      });
      
      // Update local unread count
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId ? { ...thread, unreadCount: 0 } : thread
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const subscribeToMessages = (threadId: string) => {
    const supabase = getSupabaseClient();
    
    const channel = supabase
      .channel(`shop_messages:thread_id=eq.${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload: any) => {
          const newMessage = payload.new;
          if (newMessage && newMessage.thread_id === threadId) {
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;
              
              // Translate customer/AI messages to English for owner
              const messageData: ChatMessage = {
                id: newMessage.id,
                senderType: newMessage.sender_type,
                content: newMessage.content,
                createdAt: newMessage.created_at,
                readByOwner: newMessage.read_by_owner || false,
                readByCustomer: newMessage.read_by_customer || false,
                senderId: newMessage.sender_id || null,
                originalContent: newMessage.content,
                translatedContent: newMessage.content,
              };
              
              // If customer/AI message, translate to owner's preferred language
              if (newMessage.sender_type === 'customer' || newMessage.sender_type === 'ai') {
                // Translate asynchronously
                fetch(`${apiUrl}/ai/translate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: newMessage.content,
                    targetLanguage: ownerPreferredLanguage,
                    sourceLanguage: 'auto', // Auto-detect source language
                  }),
                })
                  .then(res => res.json())
                  .then(data => {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === newMessage.id
                          ? { ...msg, translatedContent: data.translatedText || msg.content, detectedLanguage: data.sourceLanguage }
                          : msg
                      )
                    );
                  })
                  .catch(err => console.error('Error translating new message:', err));
              }
              
              return [...prev, messageData];
            });

            // Update thread last message
            setThreads((prev) =>
              prev.map((thread) =>
                thread.id === threadId
                  ? {
                      ...thread,
                      lastMessageAt: newMessage.created_at,
                      lastMessagePreview: newMessage.content?.substring(0, 100) || null,
                      lastMessageFrom: newMessage.sender_type,
                      unreadCount:
                        newMessage.sender_type === 'customer' && !newMessage.read_by_owner
                          ? thread.unreadCount + 1
                          : thread.unreadCount,
                    }
                  : thread
              )
            );
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // Handle typing indicator
  useEffect(() => {
    if (input.trim() && selectedThreadId) {
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to hide typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else {
      setIsTyping(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [input, selectedThreadId]);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading || !selectedThreadId) {
      return;
    }

    setIsTyping(false);
    const messageContent = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/messages/thread/${selectedThreadId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderType: 'owner',
          senderId: user?.id || null,
          content: messageContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const sentMessage = await res.json();
      
      // Add message to local state (realtime will also add it, but this is immediate)
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === sentMessage.id);
        if (exists) return prev;
        return [...prev, sentMessage];
      });

      // Update thread last message
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === selectedThreadId
            ? {
                ...thread,
                lastMessageAt: sentMessage.createdAt,
                lastMessagePreview: sentMessage.content?.substring(0, 100) || null,
                lastMessageFrom: 'owner',
              }
            : thread
        )
      );

      // Trigger AI response for owner messages (calendar commands, etc.)
      // Get shop ID from thread
      const currentThread = threads.find(t => t.id === selectedThreadId);
      if (currentThread?.shopId) {
        try {
          await fetch(`${apiUrl}/ai/chat-thread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              threadId: selectedThreadId,
              shopId: currentThread.shopId,
              message: messageContent,
              source: 'owner',
            }),
          });
        } catch (aiError) {
          // Silently handle AI errors - not critical for message sending
          console.error('Error triggering AI response:', aiError);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
      // Keep input focused after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('assistant.title')}</h1>
        <p className="text-gray-600">{t('assistant.subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex h-[calc(100vh-280px)] min-h-[600px]">
          {/* Left: Thread List */}
          <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">{t('assistant.customerConversations')}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white">
              {loadingThreads ? (
                <div className="p-6 text-center text-gray-500">{t('assistant.loadingThreads')}</div>
              ) : threads.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>{t('assistant.noConversations')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                        selectedThreadId === thread.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {thread.customerEmail || `Thread ${thread.id.substring(0, 8)}`}
                            </p>
                            {thread.unreadCount > 0 && (
                              <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>
                          {thread.lastMessagePreview && (
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {thread.lastMessagePreview}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatDate(thread.lastMessageAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Messages */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedThreadId ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {selectedThread?.customerEmail || `Thread ${selectedThreadId.substring(0, 8)}`}
                      </h2>
                      {selectedThread?.bookingId && (
                        <p className="text-sm text-gray-500">{t('assistant.booking')} {selectedThread.bookingId.substring(0, 8)}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleTakeover}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      ownerTakenOver
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {ownerTakenOver ? t('assistant.youAreHandling') : t('assistant.letAiHandle')}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('assistant.noMessages')}</h3>
                        <p className="text-gray-600">{t('assistant.startConversation')}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.senderType === 'owner' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.senderType !== 'owner' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">
                                {message.senderType === 'ai' ? '🤖' : '👤'}
                              </span>
                            </div>
                          )}
                          <div
                            className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${
                              message.senderType === 'owner'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.senderType === 'owner' 
                                ? (message.originalContent || message.content)
                                : (message.translatedContent || message.content)
                              }
                            </p>
                            {(message.senderType === 'customer' || message.senderType === 'ai') && 
                             message.originalContent && 
                             message.originalContent !== message.translatedContent && (
                              <p className="text-xs mt-1 opacity-75 italic">
                                🇯🇵 {message.originalContent.substring(0, 50)}
                                {message.originalContent.length > 50 ? '...' : ''}
                              </p>
                            )}
                            <p
                              className={`text-xs mt-2 ${
                                message.senderType === 'owner' ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                          {message.senderType === 'owner' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-gray-600">You</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3 justify-end">
                          <div className="bg-gray-100 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                              <span className="text-xs text-gray-500 ml-2">{t('assistant.youAreTyping')}</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-600">You</span>
                          </div>
                        </div>
                      )}
                      {loading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">🤖</span>
                          </div>
                          <div className="bg-gray-100 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t('assistant.typeMessage')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? t('assistant.sending') : t('assistant.send')}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('assistant.selectConversation')}</h3>
                  <p className="text-gray-600">{t('assistant.selectConversationDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
