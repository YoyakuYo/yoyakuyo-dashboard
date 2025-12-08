"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_role: 'owner' | 'staff';
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
    role?: string;
    display_name?: string;
  };
}

interface SupportConversation {
  id: string;
  shop_id: string;
  owner_id: string;
  staff_id?: string;
  created_at: string;
  updated_at: string;
  shop?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

export default function SupportInboxPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Helper function to determine message label based on sender_id and sender.role
  const getMessageLabel = (msg: Message): string => {
    const isCurrentUser = msg.sender_id === user?.id;
    const currentUserRole = 'staff'; // Staff dashboard - current user is always staff
    const senderRole = msg.sender?.role || msg.sender_role;
    
    if (isCurrentUser) {
      // Current user's message (staff)
      return '🛟 You (Staff)';
    } else {
      // Other person's message - use sender's role from database
      return senderRole === 'owner' ? '👤 Shop Owner' : '🛟 Staff';
    }
  };

  // Helper function to get sender display name
  const getSenderDisplayName = (msg: Message): string => {
    return msg.sender?.display_name || msg.sender?.full_name || msg.sender?.email || 'Unknown';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadConversations();
    }
  }, [user, authLoading, router]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('support-inbox-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Reload conversations when messages change
          loadConversations();
          if (selectedConversation) {
            loadMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get all owner_staff conversations (support tickets)
      const res = await fetch(`${apiUrl}/api/conversations?type=owner_staff`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        // Calculate unread counts for each conversation
        const convsWithUnread = await Promise.all(
          (data.conversations || []).map(async (conv: any) => {
            const messagesRes = await fetch(`${apiUrl}/api/conversations/${conv.id}`, {
              headers: { 'x-user-id': user.id },
            });
            if (messagesRes.ok) {
              const messagesData = await messagesRes.json();
              const unreadCount = (messagesData.messages || []).filter(
                (m: Message) => !m.is_read && m.sender_role === 'owner'
              ).length;
              const lastMessage = messagesData.messages?.[messagesData.messages.length - 1];
              return {
                ...conv,
                unread_count: unreadCount,
                last_message: lastMessage ? {
                  content: lastMessage.content,
                  created_at: lastMessage.created_at,
                } : undefined,
              };
            }
            return { ...conv, unread_count: 0 };
          })
        );
        
        // Sort by updated_at (most recent first)
        convsWithUnread.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        
        setConversations(convsWithUnread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/conversations/${conversationId}`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        const unreadMessages = data.messages?.filter(
          (m: Message) => !m.is_read && m.sender_role === 'owner'
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          // Mark as read (you may need to add an API endpoint for this)
          // For now, we'll just reload conversations to update counts
          setTimeout(() => loadConversations(), 500);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !input.trim() || sending || !user?.id) return;

    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (res.ok) {
        setInput('');
        await loadMessages(selectedConversation);
        await loadConversations();
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

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  if (authLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/staff-dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Support Inbox</h1>
        <p className="text-gray-600 mt-1">Manage support conversations with shop owners</p>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-white rounded-lg shadow border border-gray-200" style={{ height: '700px' }}>
        {/* Conversations List */}
        <div className="border-r overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Support Tickets</h2>
            <p className="text-xs text-gray-500 mt-1">
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>
          
          <div className="divide-y">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No support conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    loadMessages(conv.id);
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm text-gray-900">
                      {conv.shop?.name || 'Shop'}
                    </p>
                    {conv.unread_count && conv.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {conv.owner?.full_name || conv.owner?.email || 'Owner'}
                  </p>
                  {conv.last_message && (
                    <p className="text-xs text-gray-500 truncate">
                      {conv.last_message.content.substring(0, 50)}
                      {conv.last_message.content.length > 50 ? '...' : ''}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  {selectedConvData?.shop?.name || 'Shop'}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedConvData?.owner?.full_name || selectedConvData?.owner?.email || 'Owner'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    // ALIGNMENT RULE: IF sender_id === currentUser.id → RIGHT, ELSE → LEFT
                    const isCurrentUser = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              isCurrentUser
                                ? 'bg-blue-500 text-white'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {getMessageLabel(msg)}
                            </span>
                            <span className={`text-xs font-medium ${
                              isCurrentUser ? 'opacity-90' : 'text-gray-600'
                            }`}>
                              {getSenderDisplayName(msg)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'opacity-70' : 'text-gray-500'
                          }`}>
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
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
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Select a conversation</p>
                <p className="text-sm">Choose a support ticket from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

