// apps/dashboard/app/components/OwnerPowerBot.tsx
// Fixed bottom-right chat bubble for owner power bot

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';

interface Message {
  id: string;
  content: string;
  sender: 'owner' | 'bot';
  timestamp: Date;
}

export default function OwnerPowerBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerLanguage, setOwnerLanguage] = useState('en');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // Load owner language
  useEffect(() => {
    if (user?.id) {
      fetch(`${apiUrl}/users/me`, {
        headers: { 'x-user-id': user.id },
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data) {
            setOwnerLanguage(data.preferredLanguage || 'en');
          }
        })
        .catch((error: any) => {
          // Silently handle connection errors (API server not running)
          if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
            console.error('Error loading owner language:', error);
          }
        });
    }
  }, [user, apiUrl]);

  // Get shop ID and owner thread
  const [shopId, setShopId] = useState<string | null>(null);
  useEffect(() => {
    if (user?.id) {
      fetch(`${apiUrl}/shops`, {
        headers: { 'x-user-id': user.id },
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then(shops => {
          if (shops && Array.isArray(shops) && shops.length > 0) {
            const firstShopId = shops[0].id;
            setShopId(firstShopId);
            
            // Get or create owner thread for this shop
            fetch(`${apiUrl}/owner/thread?shopId=${firstShopId}`, {
              headers: { 'x-user-id': user.id },
            })
              .then(res => {
                if (res.ok) {
                  return res.json();
                }
                return null;
              })
              .then(data => {
                if (data?.threadId) {
                  setThreadId(data.threadId);
                  // Load thread messages
                  loadThreadMessages(data.threadId);
                }
              })
              .catch((error: any) => {
                // Silently handle connection errors
                if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                  console.error('Error loading owner thread:', error);
                }
              })
              .finally(() => {
                setLoadingThread(false);
              });
          } else {
            setLoadingThread(false);
          }
        })
        .catch((error: any) => {
          // Silently handle connection errors (API server not running)
          if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
            console.error('Error loading shops:', error);
          }
          setLoadingThread(false);
        });
    } else {
      setLoadingThread(false);
    }
  }, [user, apiUrl]);

  // Load thread messages
  const loadThreadMessages = async (threadIdToLoad: string) => {
    try {
      const res = await fetch(`${apiUrl}/messages/thread/${threadIdToLoad}`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const threadMessages = await res.json();
        // Convert to local Message format
        const convertedMessages: Message[] = (Array.isArray(threadMessages) ? threadMessages : []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.senderType === 'owner' ? 'owner' : 'bot',
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(convertedMessages);
      }
    } catch (error: any) {
      // Silently handle connection errors
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error loading thread messages:', error);
      }
    }
  };

  // Subscribe to real-time messages for owner thread
  useEffect(() => {
    if (threadId && isOpen) {
      const supabase = getSupabaseClient();
      
      const channel = supabase
        .channel(`owner_messages:thread_id=eq.${threadId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'shop_messages',
            filter: `thread_id=eq.${threadId}`,
          },
          (payload: any) => {
            const newMessage = payload.new;
            if (newMessage && newMessage.thread_id === threadId) {
              // Check if message already exists
              setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === newMessage.id);
                if (exists) return prev;
                
                return [
                  ...prev,
                  {
                    id: newMessage.id,
                    content: newMessage.content,
                    sender: newMessage.sender_type === 'owner' ? 'owner' : 'bot',
                    timestamp: new Date(newMessage.created_at),
                  },
                ];
              });
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;

      return () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      };
    }
  }, [threadId, isOpen]);

  // Load persistent history from owner_ai_messages when chat opens
  useEffect(() => {
    if (isOpen && user?.id && shopId && messages.length === 0) {
      loadOwnerAIMessages();
    }
  }, [isOpen, user, shopId]);

  // Load owner AI messages from persistent storage
  const loadOwnerAIMessages = async () => {
    try {
      const res = await fetch(`${apiUrl}/owner/messages?shopId=${shopId}`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const history = await res.json();
        // Convert to local Message format
        const convertedMessages: Message[] = (Array.isArray(history) ? history : []).map((msg: any) => ({
          id: msg.id,
          content: msg.message,
          sender: msg.role === 'user' ? 'owner' : 'bot',
          timestamp: new Date(msg.created_at),
        }));
        setMessages(convertedMessages);
      }
    } catch (error: any) {
      // Silently handle connection errors
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error loading owner AI messages:', error);
      }
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Send command or chat message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !shopId) return;

    const command = input.trim();
    setInput('');
    setLoading(true);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Add owner message optimistically (will be replaced by real message from DB via real-time)
    const tempOwnerMsgId = `temp_${Date.now()}`;
    const ownerMsg: Message = {
      id: tempOwnerMsgId,
      content: command,
      sender: 'owner',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, ownerMsg]);

    try {
      // Build conversation history for context (last 10 messages)
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.sender === 'owner' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        }));

      // Parse and execute command OR chat
      const res = await fetch(`${apiUrl}/owner/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          shopId,
          command,
          ownerLanguage,
          conversationHistory, // Send conversation history for context
          threadId: threadId, // Include thread ID to save messages
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update threadId if returned (for new threads)
        if (data.threadId && !threadId) {
          setThreadId(data.threadId);
        }
        
        // Add bot response optimistically (will be replaced by real message from DB via real-time)
        const tempBotMsgId = `temp_${Date.now() + 1}`;
        const botMsg: Message = {
          id: tempBotMsgId,
          content: data.message || 'Done!',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
        
        // Real-time subscription will replace optimistic messages with real ones from DB
        // Remove temp messages after a delay if they weren't replaced
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
          // Reload to get all real messages
          if (data.threadId || threadId) {
            loadThreadMessages(data.threadId || threadId!);
          }
        }, 1000);
      } else {
        // Remove optimistic owner message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempOwnerMsgId));
        
        const errorData = await res.json().catch(() => ({}));
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${errorData.error || errorData.message || 'Failed to execute command'}`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error: any) {
      // Remove optimistic owner message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempOwnerMsgId));
      
      // Handle connection errors gracefully
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Error: API server is not running. Please start the API server.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      } else {
        console.error('Error executing command/chat:', error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Error: Could not execute command or chat',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get bot title in owner's language
  const botTitle = ownerLanguage === 'ja' ? 'AIアシスタント' : 'AI Assistant';

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">{botTitle}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
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
                <p className="font-medium mb-2">Chat with AI or give commands:</p>
                <ul className="text-left space-y-1 text-xs">
                  <li>• Commands: "Cancel Mario X44's booking"</li>
                  <li>• Commands: "Close salon August 10-16"</li>
                  <li>• Chat: "How many bookings today?"</li>
                  <li>• Chat: "What's the weather?"</li>
                </ul>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.sender === 'owner'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-xl">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
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

