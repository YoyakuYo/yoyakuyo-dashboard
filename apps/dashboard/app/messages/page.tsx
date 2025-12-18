"use client";

import { useEffect, useState, useCallback } from "react";
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
  body?: string;
  content?: string;
  is_read: boolean;
  created_at: string;
}

export default function OwnerInboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // SINGLE SOURCE OF TRUTH: activeConversationId
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Mobile state: show chat panel or conversation list
  const [showChat, setShowChat] = useState(false);

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

  const markAsRead = useCallback(async (conversationId: string) => {
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
  }, [userId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!userId || !conversationId) {
      console.log('[Owner Inbox] Cannot load messages - missing userId or conversationId', { userId, conversationId });
      return;
    }
    
    try {
      console.log('[Owner Inbox] Loading messages for conversation:', conversationId, 'with userId:', userId);
      console.log('[Owner Inbox] API URL:', `${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`);
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies if needed
      });

      console.log('[Owner Inbox] Response status:', res.status, res.statusText);

      if (!res.ok) {
        let errorText = '';
        try {
          errorText = await res.text();
          const errorData = errorText ? JSON.parse(errorText) : { error: 'Unknown error' };
          console.error('[Owner Inbox] Failed to load messages - response not OK:', {
            status: res.status,
            statusText: res.statusText,
            error: errorData,
            rawText: errorText,
          });
          
          // PART 1 FIX: Show error state instead of "No messages yet"
          if (res.status === 403) {
            console.error('[Owner Inbox] ❌ 403 Forbidden - Access denied. Check if userId matches shop owner_user_id');
            setMessages([]); // Clear messages
            setError('Not authorized to view messages. Please ensure you are the owner of this shop.');
            return; // Don't throw, just show error
          } else if (res.status === 401) {
            console.error('[Owner Inbox] ❌ 401 Unauthorized - Authentication required');
            setMessages([]);
            setError('Authentication required. Please log in again.');
            return;
          }
        } catch (parseError) {
          console.error('[Owner Inbox] Error parsing error response:', parseError);
          errorText = await res.text();
        }
        setMessages([]);
        setError(`Failed to load messages: ${res.status}`);
        throw new Error(`Failed to load messages: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log('[Owner Inbox] Messages response:', data);
      console.log('[Owner Inbox] Messages loaded:', data.messages?.length || 0, 'messages');
      
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
        console.log('[Owner Inbox] ✅ Messages set in state:', data.messages.length);
        
        // Mark messages as read after setting them
        markAsRead(conversationId).catch(err => {
          console.error('[Owner Inbox] Error marking as read:', err);
        });
      } else {
        console.warn('[Owner Inbox] ⚠️ No messages array in response:', data);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('[Owner Inbox] ❌ Error loading messages:', error);
      setMessages([]); // Clear messages on error
      // Don't show alert here as we already showed it above for 403/401
      if (!error.message?.includes('403') && !error.message?.includes('401')) {
        alert(`Error loading messages: ${error.message || 'Unknown error'}`);
      }
    }
  }, [userId, markAsRead]);

  // CRITICAL: Load messages when activeConversationId changes
  useEffect(() => {
    console.log('[Owner Inbox] useEffect triggered - activeConversationId:', activeConversationId, 'userId:', userId);
    if (activeConversationId && userId) {
      console.log('[Owner Inbox] Calling loadMessages for:', activeConversationId);
      loadMessages(activeConversationId);
    } else {
      console.log('[Owner Inbox] Clearing messages - no active conversation');
      setMessages([]); // Clear messages when no conversation selected
    }
  }, [activeConversationId, userId, loadMessages]);

  // Update selectedConversation when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find(c => c.id === activeConversationId);
      setSelectedConversation(conv || null);
    } else {
      setSelectedConversation(null);
    }
  }, [activeConversationId, conversations]);

  const sendMessage = async () => {
    // Block send if content is empty or whitespace
    if (!newMessage || !newMessage.trim() || !activeConversationId || !userId || sending) {
      if (!newMessage || !newMessage.trim()) {
        console.warn('[Owner Inbox] Cannot send empty message');
      }
      return;
    }

    try {
      setSending(true);
      const trimmedContent = newMessage.trim();
      console.log('[Owner Inbox] Sending message:', {
        conversation_id: activeConversationId,
        contentLength: trimmedContent.length,
      });
      
      const res = await fetch(`${apiUrl}/api/internal-messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          conversation_id: activeConversationId,
          content: trimmedContent, // Send as 'content' not 'body'
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await res.json();
      console.log('[Owner Inbox] Message sent successfully:', data);
      
      // Reload messages to get the latest
      if (activeConversationId) {
        await loadMessages(activeConversationId);
      }
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
    console.log('[Owner Inbox] Conversation selected:', conversation.id, conversation.shop?.name);
    // Set activeConversationId (single source of truth)
    setActiveConversationId(conversation.id);
    // On mobile, show chat panel
    setShowChat(true);
    // Clear messages immediately to show loading state
    setMessages([]);
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Conversations List */}
      <div className={`${
        showChat ? 'hidden md:flex' : 'flex'
      } w-full md:w-1/3 border-r border-gray-200 bg-white flex-col h-full`}>
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
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
                  activeConversationId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
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
      <div className={`${
        showChat ? 'flex' : 'hidden md:flex'
      } flex-1 flex-col h-full bg-white`}>
        {activeConversationId ? (
          <>
            {/* Header with Back button on mobile */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button - mobile only */}
                <button
                  onClick={() => {
                    setShowChat(false);
                    setActiveConversationId(null);
                  }}
                  className="md:hidden text-gray-600 hover:text-gray-900"
                  aria-label="Back to conversations"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConversation?.shop?.name || 'Shop'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation ? getCustomerDisplayName(selectedConversation) : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages - scrollable area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-gray-50">
              {error ? (
                <div className="text-center text-red-600 mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-semibold">⚠️ Error</p>
                  <p className="text-sm mt-2">{error}</p>
                  <p className="text-xs mt-2 text-gray-400">Conversation ID: {activeConversationId}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                  <p className="text-xs mt-2 text-gray-400">Conversation ID: {activeConversationId}</p>
                </div>
              ) : (
                messages.map((message) => {
                  const senderRole = message.sender_role || (message.sender_type === 'shop' ? 'shop' : 'customer');
                  const isOwner = senderRole === 'shop';
                  const isAI = senderRole === 'ai';
                  // Use content field if available, fallback to body
                  const messageContent = message.content || message.body || '';
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-md px-4 py-2 rounded-lg ${
                          isOwner
                            ? 'bg-blue-600 text-white'
                            : isAI
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                        style={{
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {isAI && (
                          <p className="text-xs font-semibold text-purple-700 mb-1">AI Assistant</p>
                        )}
                        <p className="text-sm break-words whitespace-pre-wrap">{messageContent}</p>
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

            {/* Input - sticky at bottom */}
            <div className="bg-white border-t border-gray-200 px-4 md:px-6 py-4 flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
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
                  className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
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

