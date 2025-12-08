"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_role: 'owner' | 'staff';
  created_at: string;
  sender?: {
    full_name?: string;
    email?: string;
  };
}

interface SupportChatProps {
  shopId?: string;
  onClose?: () => void;
  isFloating?: boolean;
}

export default function SupportChat({ shopId, onClose, isFloating = false }: SupportChatProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Load or create support conversation
  useEffect(() => {
    if (!user?.id || !shopId) return;

    const loadConversation = async () => {
      setLoading(true);
      try {
        console.log('Loading conversation...', { shopId, userId: user.id });
        // Try to find existing support conversation
        const res = await fetch(`${apiUrl}/api/conversations?type=owner_staff`, {
          headers: { 'x-user-id': user.id },
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Conversations loaded:', data.conversations?.length || 0);
          // Find conversation for this shop
          const existingConv = data.conversations?.find((c: any) => 
            c.shop_id === shopId && c.owner_id === user.id
          );
          
          if (existingConv) {
            console.log('Found existing conversation:', existingConv.id);
            setConversationId(existingConv.id);
            await loadMessages(existingConv.id);
        } else {
          console.log('No existing conversation found, creating new one...');
          // Create new support conversation
          await createSupportConversation();
        }
      } else {
        console.error('Failed to load conversations, status:', res.status);
        const errorText = await res.text();
        console.error('Error response:', errorText);
      }
        } else {
          const errorText = await res.text();
          console.error('Failed to load conversations:', res.status, errorText);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user?.id, shopId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`support-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Reload messages when new message arrives
          loadMessages(conversationId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSupportConversation = async () => {
    if (!user?.id || !shopId) {
      console.error('Cannot create conversation: missing user.id or shopId', { userId: user?.id, shopId });
      return;
    }

    try {
      console.log('Creating support conversation...', { shopId, ownerId: user.id });
      // Create conversation (staff_id can be null, will be assigned when staff replies)
      const res = await fetch(`${apiUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          type: 'owner_staff',
          shop_id: shopId,
          owner_id: user.id,
          staff_id: null, // Will be assigned when staff replies
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Conversation created:', data.conversation?.id);
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
          await loadMessages(data.conversation.id);
        } else {
          console.error('Conversation created but no ID returned:', data);
        }
      } else {
        const errorText = await res.text();
        console.error('Failed to create conversation:', res.status, errorText);
        // Show error to user
        setLoading(false);
        alert(`Failed to create support conversation. Please check the console for details. Status: ${res.status}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create support conversation. Please try again.');
    }
  };

  const loadMessages = async (convId: string) => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/conversations/${convId}`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !input.trim() || sending || !user?.id) return;

    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (res.ok) {
        setInput('');
        await loadMessages(conversationId);
      } else {
        const errorText = await res.text();
        console.error('Failed to send message:', errorText);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (isFloating) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-blue-600 text-white flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Support</h3>
              <p className="text-xs opacity-90">We're here to help</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-700 rounded p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <p>Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm mb-2">👋 Hello! How can we help you today?</p>
                <p className="text-xs">Send us a message and we'll get back to you soon.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === 'owner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.sender_role === 'owner'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={sending || !conversationId}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || !conversationId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Full page version
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-blue-600 text-white">
        <h3 className="font-semibold">Contact Support</h3>
        <p className="text-xs opacity-90">We're here to help</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm mb-2">👋 Hello! How can we help you today?</p>
            <p className="text-xs">Send us a message and we'll get back to you soon.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_role === 'owner' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender_role === 'owner'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-xs font-medium mb-1 opacity-80">
                  {msg.sender?.full_name || msg.sender?.email || msg.sender_role}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={conversationId ? "Type your message..." : "Creating conversation..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || !conversationId || loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || !conversationId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

