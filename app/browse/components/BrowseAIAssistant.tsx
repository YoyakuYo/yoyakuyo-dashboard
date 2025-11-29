// app/browse/components/BrowseAIAssistant.tsx
// AI Assistant component for the public browse page

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Shop {
  id: string;
  name: string;
  address?: string | null;
  prefecture?: string | null;
  normalized_city?: string | null;
  city?: string | null;
  category_id?: string | null;
  description?: string | null;
}

interface BrowseAIAssistantProps {
  shops?: Shop[];
  selectedPrefecture?: string | null;
  selectedCity?: string | null;
  selectedCategoryId?: string | null;
  searchQuery?: string;
  locale?: string;
}

export function BrowseAIAssistant({
  shops = [],
  selectedPrefecture,
  selectedCity,
  selectedCategoryId,
  searchQuery,
  locale = 'en',
}: BrowseAIAssistantProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track conversation history for context
  const [rememberedLocation, setRememberedLocation] = useState<string | null>(null);
  // Session ID for persistent conversation history
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Scroll to bottom when messages change
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

  // Initialize session ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedSessionId = localStorage.getItem('yoyaku_yo_customer_ai_session');
      if (!storedSessionId) {
        storedSessionId = `customer_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('yoyaku_yo_customer_ai_session', storedSessionId);
      }
      setSessionId(storedSessionId);
    }
  }, []);

  // Load conversation history when session ID is available
  useEffect(() => {
    if (sessionId && shops.length > 0) {
      loadConversationHistory();
    }
  }, [sessionId, shops.length]);

  // Reload conversation history when chat opens to ensure we have the latest messages
  useEffect(() => {
    if (isOpen && sessionId && shops.length > 0) {
      loadConversationHistory();
    }
  }, [isOpen, sessionId, shops.length]);

  // Also reload history periodically (every 30 seconds) when chat is open
  useEffect(() => {
    if (isOpen && sessionId && shops.length > 0) {
      const interval = setInterval(() => {
        loadConversationHistory();
      }, 30000); // Reload every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId, shops.length]);

  const loadConversationHistory = async () => {
    if (!sessionId || shops.length === 0) return;
    
    try {
      // Use the first shop's ID for loading history (customer AI is general, not shop-specific)
      const shopId = shops[0].id;
      const res = await fetch(`${apiUrl}/customer-ai/my-messages?customerId=${sessionId}&shopId=${shopId}`);
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

  // Extract location from conversation messages
  useEffect(() => {
    // Look for location mentions in user messages (scan from newest to oldest)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user') {
        // Patterns to match location mentions
        const locationPatterns = [
          /(?:live in|from|I'm in|I am in|located in|in|at|near)\s+([^\s,\.!?]+(?:\s+[^\s,\.!?]+)?(?:\s*(?:shi|city|ward|ku|cho|machi|市|区|町|村))?)/i,
          /(?:do you have|are there|any|shops?)\s+(?:in|at|near)\s+([^\s,\.!?]+(?:\s+[^\s,\.!?]+)?(?:\s*(?:shi|city|ward|ku|cho|machi|市|区|町|村))?)/i,
        ];
        
        for (const pattern of locationPatterns) {
          const match = msg.content.match(pattern);
          if (match && match[1]) {
            const extractedLocation = match[1].trim();
            if (extractedLocation && extractedLocation !== rememberedLocation) {
              setRememberedLocation(extractedLocation);
              break;
            }
          }
        }
        if (rememberedLocation) break;
      }
    }
  }, [messages]); // Only depend on messages, not rememberedLocation to avoid loops

  // Suggested prompts
  const suggestedPrompts = [
    selectedPrefecture 
      ? `Show me shops in ${selectedPrefecture}`
      : 'Show me shops in Tokyo',
    selectedCategoryId
      ? 'What services are available?'
      : 'What categories do you have?',
    'Help me find a salon near me',
    'What are your most popular shops?',
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Build conversation history from previous messages (last 10 for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      // Build messages array for unified endpoint
      const messagesForAPI = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage.content },
      ];

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'customer',
          messages: messagesForAPI,
          locale: locale,
          prefecture: selectedPrefecture || null,
          category: selectedCategoryId || null,
          searchQuery: searchQuery || null,
          customerId: sessionId, // Send session ID for persistent storage
          shops: shops.map(s => ({
            id: s.id,
            name: s.name,
            address: s.address,
            prefecture: s.prefecture,
            normalized_city: s.normalized_city,
            city: s.city || null,
            category_id: s.category_id,
            description: s.description,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      // Check if booking was created (booking_result in response)
      let messageContent = data.response || 'Sorry, I could not generate a response.';
      
      // The AI already generates booking confirmation messages with properly formatted dates
      // Don't prepend a duplicate message - the AI handles the confirmation message
      // Only add a warning prefix if booking failed and AI didn't already indicate failure
      if (data.booking_result && !data.booking_result.success && !messageContent.includes('⚠️') && !messageContent.includes('Sorry')) {
        // Booking failed - AI should have explained, but add context if missing
        messageContent = `⚠️ ${messageContent}`;
      }
      
      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Reload history from database after sending message to ensure we have the latest
      // This ensures messages are always in sync with the database
      if (sessionId && shops.length > 0) {
        setTimeout(() => {
          loadConversationHistory();
        }, 1000); // Wait 1 second for backend to save
      }
    } catch (err: any) {
      console.error('Error sending message to AI:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label="Open AI Assistant"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p className="font-medium mb-2">Hi! I'm your AI assistant.</p>
                <p className="text-xs mb-4">I can help you find shops by area, category, or preferences.</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Try asking:</p>
                  {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="block w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-xs transition-colors"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content.split(/(\/shops\/[a-zA-Z0-9-]+)/g).map((part, idx) => {
                      if (part.startsWith('/shops/')) {
                        const shopId = part.replace('/shops/', '');
                        return (
                          <a
                            key={idx}
                            href={part}
                            className="text-purple-600 hover:text-purple-800 underline font-semibold"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = part;
                            }}
                          >
                            {part}
                          </a>
                        );
                      }
                      return <span key={idx}>{part}</span>;
                    })}
                  </div>
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

          {/* Error message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-xl">
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
                placeholder="Ask me about shops..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
              >
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

