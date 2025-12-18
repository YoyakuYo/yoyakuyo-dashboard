"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";

interface Conversation {
  id: string;
  shop_id: string;
  customer_type: 'line' | 'web' | 'guest';
  customer_ref: string;
  last_message_at: string | null;
  created_at: string;
  unread_count: number;
  shop?: {
    id: string;
    name: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_role?: 'customer' | 'shop' | 'ai';
  sender_type: 'customer' | 'shop';
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function OwnerInboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage or session
    const storedUserId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(storedUserId);
      loadConversations(storedUserId);
    } else {
      // Try to get from Supabase session
      // For now, redirect to login if no user ID
      console.error('[Owner Inbox] No user ID found');
      router.push('/auth-owners');
    }
  }, []);

  const loadConversations = async (ownerUserId: string) => {
    try {
      setLoading(true);
      console.log('[Owner Inbox] Loading conversations for owner:', ownerUserId);
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/owner/conversations`, {
        headers: {
          'x-user-id': ownerUserId,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await res.json();
      console.log('[Owner Inbox] Conversations loaded:', data.conversations?.length || 0);
      
      // Load shop names for each conversation
      const conversationsWithShops = await Promise.all(
        (data.conversations || []).map(async (conv: Conversation) => {
          try {
            const shopRes = await fetch(`${apiUrl}/shops/${conv.shop_id}`);
            if (shopRes.ok) {
              const shopData = await shopRes.json();
              return { ...conv, shop: { id: shopData.id, name: shopData.name } };
            }
          } catch (error) {
            console.error('[Owner Inbox] Error loading shop:', error);
          }
          return conv;
        })
      );
      
      setConversations(conversationsWithShops);
    } catch (error) {
      console.error('[Owner Inbox] Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!userId) return;
    
    try {
      console.log('[Owner Inbox] Loading messages for conversation:', conversationId);
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await res.json();
      console.log('[Owner Inbox] Messages loaded:', data.messages?.length || 0);
      setMessages(data.messages || []);
      
      // Mark messages as read
      await markAsRead(conversationId);
    } catch (error) {
      console.error('[Owner Inbox] Error loading messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!userId) return;
    
    try {
      await fetch(`${apiUrl}/api/internal-messaging/conversations/${conversationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
        },
      });
      
      // Update unread count in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('[Owner Inbox] Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    // Block send if content is empty or whitespace
    if (!newMessage || !newMessage.trim() || !selectedConversation || !userId || sending) {
      if (!newMessage || !newMessage.trim()) {
        console.warn('[Owner Inbox] Cannot send empty message');
      }
      return;
    }

    try {
      setSending(true);
      const trimmedContent = newMessage.trim();
      console.log('[Owner Inbox] Sending message:', {
        conversation_id: selectedConversation.id,
        contentLength: trimmedContent.length,
      });
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
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
      
      // Add message to list
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
      
      // Reload conversations to update last_message_at
      if (userId) {
        loadConversations(userId);
      }
    } catch (error: any) {
      console.error('[Owner Inbox] Error sending message:', error);
      alert(`Error: ${error.message || 'Failed to send message'}`);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const getCustomerDisplayName = (conv: Conversation) => {
    if (conv.customer_type === 'line') {
      return 'LINE User';
    } else if (conv.customer_type === 'web') {
      return 'Web User';
    } else {
      return 'Guest';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
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
                  <h3 className="font-semibold text-gray-900">
                    {conv.shop?.name || 'Shop'}
                  </h3>
                  {conv.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{getCustomerDisplayName(conv)}</p>
                {conv.last_message_at && (
                  <p className="text-xs text-gray-400 mt-1">
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedConversation.shop?.name || 'Shop'}
              </h2>
              <p className="text-sm text-gray-500">{getCustomerDisplayName(selectedConversation)}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const senderRole = message.sender_role || (message.sender_type === 'shop' ? 'shop' : 'customer');
                  const isOwner = senderRole === 'shop';
                  const isAI = senderRole === 'ai';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwner
                            ? 'bg-blue-600 text-white'
                            : isAI
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {isAI && (
                          <p className="text-xs font-semibold text-purple-700 mb-1">AI Assistant</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwner ? 'text-blue-100' : isAI ? 'text-purple-600' : 'text-gray-500'
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

            {/* Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

