"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCustomAuth } from '@/lib/useCustomAuth';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { messagingFetch } from '@/app/lib/messagingApiClient';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Conversation {
  id: string;
  shop_id: string | null;
  booking_id: string | null;
  customer_type: string;
  customer_ref: string;
  is_support_ticket: boolean;
  support_status: string;
  last_message_at: string;
  created_at: string;
  unread_count: number;
  shop?: {
    id: string;
    name: string;
  } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  isCustomerMessage?: boolean;
  sender?: {
    id: string;
    source: string;
    source_id: string;
    display_name: string;
    role: string;
  };
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size?: number;
    signed_url?: string;
  }>;
}

export default function CustomerSupportPage() {
  const { user } = useCustomAuth();
  const t = useTranslations();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [supportType, setSupportType] = useState<'admin' | 'owner' | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shops, setShops] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadCustomerShops();
    }
  }, [user]);

  const loadCustomerShops = async () => {
    if (!user?.id) return;

    try {
      setLoadingShops(true);
      // Fetch customer bookings to get shops they've interacted with
      const res = await fetch(`${apiUrl}/customers/bookings`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const bookings = Array.isArray(data) ? data : (data.bookings || []);
        
        // Extract unique shops from bookings
        const shopMap = new Map<string, { id: string; name: string }>();
        bookings.forEach((booking: any) => {
          // Handle both shop object and shop_id/shop_name format
          const shopId = booking.shop_id || booking.shop?.id;
          const shopName = booking.shop_name || booking.shop?.name;
          
          if (shopId && shopName && !shopMap.has(shopId)) {
            shopMap.set(shopId, {
              id: shopId,
              name: shopName,
            });
          }
        });

        setShops(Array.from(shopMap.values()));
      }
    } catch (error) {
      console.error('Error loading customer shops:', error);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
      subscribeToMessages(selectedConversationId);
    }

    return () => {
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/conversations`,
        {
          userId: user.id,
        }
      );

      if (res.ok) {
        const { conversations: convs } = await res.json();
        setConversations(convs || []);
        
        // Auto-select first conversation if available
        if (convs && convs.length > 0 && !selectedConversationId) {
          setSelectedConversationId(convs[0].id);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to load conversations:", res.status, errorData);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/conversations/${conversationId}`,
        {
          userId: user.id,
        }
      );

      if (res.ok) {
        const { messages: msgs } = await res.json();
        setMessages(msgs || []);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to load messages:", res.status, errorData);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const supabase = getSupabaseClient();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`customer-support-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages(conversationId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages(conversationId);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const createSupportTicket = async () => {
    if (!supportType || !initialMessage.trim() || creating || !user?.id) return;

    if (supportType === 'owner' && !shopId) {
      alert('Please select a shop for owner support');
      return;
    }

    setCreating(true);
    const content = initialMessage.trim();

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/create`,
        {
          method: 'POST',
          userId: user.id,
          body: {
            support_type: supportType,
            shop_id: shopId,
            content,
          },
        }
      );

      if (res.ok) {
        const { conversation, message } = await res.json();
        setConversations(prev => [conversation, ...prev]);
        setSelectedConversationId(conversation.id);
        setMessages([message]);
        setSupportType(null);
        setInitialMessage("");
        setShopId(null);
        await loadConversations();
      } else {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to create support ticket:", res.status, error);
        alert(error.error || 'Failed to create support ticket');
      }
    } catch (error) {
      console.error("Error creating support ticket:", error);
      alert('Failed to create support ticket');
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversationId || sending || !user?.id) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/conversations/${selectedConversationId}/reply`,
        {
          method: 'POST',
          userId: user.id,
          body: {
            content,
          },
        }
      );

      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => [...prev, message]);
        await loadConversations();
      } else {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to send message:", res.status, error);
        alert(error.error || 'Failed to send message');
        setInput(content);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show create ticket form if no conversation selected and no conversations exist
  if (!selectedConversationId && conversations.length === 0 && !supportType) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {t('customer.support.title') || 'Contact Support'}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('customer.support.description') || 'Need help? Contact our support team or reach out to a shop owner.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact Admin */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('customer.support.contactAdmin') || 'Contact Admin Support'}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('customer.support.adminDescription') || 'Get help from our platform support team'}
            </p>
            <button
              onClick={() => setSupportType('admin')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('customer.support.startChat') || 'Start Chat'}
            </button>
          </div>

          {/* Contact Owner */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('customer.support.contactOwner') || 'Contact Shop Owner'}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('customer.support.ownerDescription') || 'Reach out to a specific shop owner'}
            </p>
            <button
              onClick={() => setSupportType('owner')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('customer.support.startChat') || 'Start Chat'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show create ticket form
  if (supportType && !selectedConversationId) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <button
          onClick={() => {
            setSupportType(null);
            setInitialMessage("");
            setShopId(null);
          }}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← {t('common.back') || 'Back'}
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {supportType === 'admin' 
            ? (t('customer.support.contactAdmin') || 'Contact Admin Support')
            : (t('customer.support.contactOwner') || 'Contact Shop Owner')}
        </h1>

        {supportType === 'owner' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customer.support.selectShop') || 'Select Shop'}
            </label>
            {loadingShops ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                {t('common.loading') || 'Loading shops...'}
              </div>
            ) : shops.length > 0 ? (
              <select
                value={shopId || ''}
                onChange={(e) => setShopId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('customer.support.selectShopPlaceholder') || 'Select a shop...'}</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                {t('customer.support.noShops') || 'No shops found. Please make a booking first.'}
              </div>
            )}
            {shops.length === 0 && !loadingShops && (
              <p className="mt-2 text-sm text-gray-500">
                {t('customer.support.noShopsHint') || 'You need to have at least one booking to contact a shop owner.'}
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('customer.support.message') || 'Your Message'}
          </label>
          <textarea
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder={t('customer.support.messagePlaceholder') || 'Describe your issue or question...'}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={createSupportTicket}
          disabled={creating || !initialMessage.trim() || (supportType === 'owner' && !shopId)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating 
            ? (t('common.sending') || 'Sending...')
            : (t('customer.support.send') || 'Send Message')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('customer.support.supportTickets') || 'Support Tickets'}
          </h2>
          <button
            onClick={() => setSupportType('admin')}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + {t('customer.support.new') || 'New'}
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>{t('customer.support.noTickets') || 'No support tickets yet'}</p>
            <button
              onClick={() => setSupportType('admin')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('customer.support.createTicket') || 'Create Support Ticket'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => {
              // Admin support tickets have null shop_id or no shop data
              const isAdminSupport = !conv.shop_id || conv.shop_id === null || !conv.shop || conv.shop?.name === null;
              const displayName = isAdminSupport 
                ? (t('customer.support.adminSupport') || 'Admin Support')
                : conv.shop?.name || 'Shop Owner';

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedConversationId === conv.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{displayName}</p>
                    {conv.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      const dateStr = conv.last_message_at || conv.created_at;
                      if (!dateStr) return '';
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                    })()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {conv.support_status === 'open' 
                      ? (t('customer.support.statusOpen') || 'Open')
                      : conv.support_status === 'resolved'
                      ? (t('customer.support.statusResolved') || 'Resolved')
                      : conv.support_status}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.shop_id && selectedConversation.shop?.name
                      ? selectedConversation.shop.name
                      : (t('customer.support.adminSupport') || 'Admin Support')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.support_status === 'open'
                      ? (t('customer.support.statusOpen') || 'Open')
                      : selectedConversation.support_status}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>{t('customer.support.noMessages') || 'No messages yet'}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.isCustomerMessage !== false && 
                    (msg.sender?.role === 'customer' || 
                     msg.sender?.source === 'web' || 
                     msg.sender?.source === 'line' || 
                     msg.sender?.source === 'guest');

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCustomer
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {isCustomer 
                            ? (t('customer.support.you') || 'You')
                            : msg.sender?.display_name || (t('customer.support.support') || 'Support')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.signed_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs underline"
                              >
                                📎 {att.file_name} ({(att.file_size || 0) / 1024} KB)
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-xs mt-1 opacity-75">
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
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('customer.support.typeMessage') || 'Type your message...'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (t('common.sending') || 'Sending...') : (t('common.send') || 'Send')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>{t('customer.support.selectConversation') || 'Select a conversation to view messages'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

