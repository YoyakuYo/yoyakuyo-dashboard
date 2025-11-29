// app/components/OwnerAIChat.tsx
// Shared AI chat component for owners (used by both bubble and full-page)

"use client";
import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface OwnerAIChatContextType {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  openChat: () => void;
  isOpen: boolean;
}

const OwnerAIChatContext = createContext<OwnerAIChatContextType | null>(null);

export function useOwnerAIChat() {
  const context = useContext(OwnerAIChatContext);
  if (!context) {
    throw new Error('useOwnerAIChat must be used within OwnerAIChatProvider');
  }
  return context;
}

// Provider component to share conversation state
export function OwnerAIChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [shouldOpenChat, setShouldOpenChat] = useState(false);
  // Language is now auto-detected by backend from shop data, no need to load from user profile

  // Load shop ID
  useEffect(() => {
    if (user?.id) {
      // Load shop ID
      fetch(`${apiUrl}/shops`, {
        headers: { 'x-user-id': user.id },
      })
        .then(res => res.ok ? res.json() : null)
        .then(shops => {
          if (shops && Array.isArray(shops) && shops.length > 0) {
            setShopId(shops[0].id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Load conversation history when shopId is available
  useEffect(() => {
    if (user?.id && shopId) {
      loadConversationHistory();
    }
  }, [user, shopId]);

  const loadConversationHistory = async () => {
    if (!user?.id || !shopId) return;
    try {
      const res = await fetch(`${apiUrl}/owner/messages?shopId=${shopId}`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const history = await res.json();
        const convertedMessages: Message[] = (Array.isArray(history) ? history : []).map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.message || msg.content || '',
          timestamp: new Date(msg.created_at || Date.now()),
        }));
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const openChat = () => {
    setShouldOpenChat(true);
  };

  // Reset shouldOpenChat after it's been consumed
  useEffect(() => {
    if (shouldOpenChat) {
      // Reset after a short delay to allow components to react
      const timer = setTimeout(() => {
        setShouldOpenChat(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldOpenChat]);

  return (
    <OwnerAIChatContext.Provider value={{ messages, addMessage, clearMessages, openChat, isOpen: shouldOpenChat }}>
      {children}
    </OwnerAIChatContext.Provider>
  );
}

interface OwnerAIChatProps {
  fullPage?: boolean;
  onClose?: () => void;
}

export function OwnerAIChat({ fullPage = false, onClose }: OwnerAIChatProps) {
  const { messages, addMessage, isOpen: shouldOpenFromContext } = useOwnerAIChat();
  const { user } = useAuth();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(fullPage);
  // MODIFIED: Add ref to track if user manually closed the chat
  const userClosedRef = useRef(false);
  
  // MODIFIED: Open chat when shouldOpenFromContext is set to true, but only if user hasn't manually closed it
  useEffect(() => {
    if (shouldOpenFromContext && !fullPage && !userClosedRef.current) {
      setIsOpen(true);
      // Reset the closed flag when context opens it (e.g., from assistant page)
      userClosedRef.current = false;
    }
  }, [shouldOpenFromContext, fullPage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  // Language is now auto-detected by backend from shop data, no need to load from user profile

  // Load shop ID
  useEffect(() => {
    if (user?.id) {
      fetch(`${apiUrl}/shops`, {
        headers: { 'x-user-id': user.id },
      })
        .then(res => res.ok ? res.json() : null)
        .then(shops => {
          if (shops && Array.isArray(shops) && shops.length > 0) {
            setShopId(shops[0].id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) {
      return;
    }

    const messageContent = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // If shopId is not loaded yet, try to load it first
      let currentShopId = shopId;
      if (!currentShopId && user?.id) {
        try {
          const shopsRes = await fetch(`${apiUrl}/shops?my_shops=true&page=1&limit=1`, {
            headers: { 'x-user-id': user.id },
          });
          if (shopsRes.ok) {
            const shopsData = await shopsRes.json();
            const shops = shopsData.shops || shopsData.data || [];
            if (shops.length > 0) {
              currentShopId = shops[0].id;
              setShopId(currentShopId);
            }
          }
        } catch (err) {
          console.error('Error loading shop:', err);
          // Continue anyway - some commands might work without shopId
        }
      }

      // Build messages array for unified endpoint
      const messagesForAPI = [
        ...messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: messageContent },
      ];

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          role: 'owner',
          messages: messagesForAPI,
          userId: user?.id,
          shopContext: currentShopId ? { shopId: currentShopId } : undefined,
          locale: 'auto', // Backend will auto-detect from shop data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      addMessage(aiMessage);
    } catch (err: any) {
      console.error('Error sending message to AI:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const botTitle = 'AI Assistant'; // Language-specific title will be handled by backend

  return (
    <>
      {/* Chat Bubble Button - only show if not fullPage mode */}
      {!fullPage && !isOpen && (
        <button
          onClick={() => {
            // MODIFIED: Reset userClosedRef when user manually opens chat
            userClosedRef.current = false;
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label={t('nav.aiAssistant')}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={fullPage 
          ? "w-full h-full bg-white flex flex-col" 
          : "fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50"
        }>
          {/* Header */}
          <div className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 ${fullPage ? '' : 'rounded-t-xl'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">{botTitle}</h3>
            </div>
            {!fullPage && (
              <button
                onClick={() => {
                  // MODIFIED: Set userClosedRef to true to prevent auto-reopening
                  userClosedRef.current = true;
                  setIsOpen(false);
                  onClose?.();
                }}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                <p className="font-medium mb-2">
                  Good morning, what can I do for you today?
                </p>
                <ul className="text-left space-y-1 text-xs mt-4">
                  <li>• Check bookings</li>
                  <li>• View schedule</li>
                  <li>• Shop performance</li>
                </ul>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className={`border-t border-gray-200 p-3 bg-white ${fullPage ? '' : 'rounded-b-xl'}`}>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Type a command or chat..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                onClick={(e) => {
                  e.preventDefault();
                  if (input.trim() && !loading) {
                    handleSend(e);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? '...' : '→'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

