// apps/dashboard/app/c/[magicCode]/page.tsx
// Customer permanent chat page with magic code URL

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';

interface Message {
  id: string;
  sender_type: 'customer' | 'ai' | 'owner';
  content: string;
  created_at: string;
  originalContent?: string;
  translatedContent?: string;
  detectedLanguage?: string;
}

interface Customer {
  id: string;
  customer_id_display: string;
  first_name: string;
  last_name: string;
  preferred_language: string;
  threadId?: string | null; // Thread ID for customer chat
  shopId?: string; // Shop ID
}

export default function CustomerChatPage() {
  const params = useParams();
  const router = useRouter();
  const magicCode = params.magicCode as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseClient();

  // Initialize customer from magic code
  useEffect(() => {
    if (!magicCode) return;

    const initializeCustomer = async () => {
      try {
        // Find customer by magic code
        const res = await fetch(`${apiUrl}/customers/magic/${magicCode}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data);
          
          // Load chat history
          if (data.threadId) {
            loadMessages(data.threadId);
          }
        } else {
          console.error('Customer not found');
        }
      } catch (error) {
        console.error('Error initializing customer:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeCustomer();
  }, [magicCode, apiUrl]);

  // Load messages
  const loadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`${apiUrl}/messages/thread/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        // API returns messages directly as an array, not wrapped in a messages property
        const messagesData = Array.isArray(data) ? data : [];
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!customer?.threadId) return;

    const channel = supabase
      .channel(`thread-${customer.threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shop_messages',
        filter: `thread_id=eq.${customer.threadId}`,
      }, (payload: any) => {
        const newMessage = payload.new;
        setMessages(prev => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer?.threadId, supabase]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !customer) return;

    const messageText = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Send message
      const res = await fetch(`${apiUrl}/messages/thread/${customer.threadId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'customer',
          content: messageText,
        }),
      });

      if (res.ok) {
        // Trigger AI response
        await fetch(`${apiUrl}/ai/chat-thread`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: customer.threadId,
            shopId: customer.shopId,
            message: messageText,
            source: 'customer',
          }),
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
      // Keep input focused after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Not Found</h1>
          <p className="text-gray-600">This chat link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.customer_id_display}さん
          </h1>
          <p className="text-sm text-gray-600">Your permanent chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.sender_type === 'customer'
                    ? 'bg-blue-600 text-white'
                    : msg.sender_type === 'owner'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{msg.translatedContent || msg.content}</p>
                {msg.originalContent && msg.originalContent !== msg.translatedContent && (
                  <p className="text-xs mt-1 opacity-75 italic">
                    {msg.originalContent.substring(0, 50)}...
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

