"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import { messagingFetch } from '@/app/lib/messagingApiClient';
import { useLineAppI18n } from '../i18n';

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

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

const supportTexts = {
  title: {
    ja: "サポート",
    en: "Support",
    es: "Soporte",
    pt: "Suporte",
    ko: "지원",
    zh: "支持",
  },
  description: {
    ja: "お困りですか？サポートチームまたは店舗オーナーにお問い合わせください。",
    en: "Need help? Contact our support team or reach out to a shop owner.",
    es: "¿Necesitas ayuda? Contacta con nuestro equipo de soporte o con un propietario de tienda.",
    pt: "Precisa de ajuda? Entre em contato com nossa equipe de suporte ou com um proprietário de loja.",
    ko: "도움이 필요하신가요? 지원팀이나 가게 주인에게 연락하세요.",
    zh: "需要帮助？联系我们的支持团队或店铺所有者。",
  },
  contactAdmin: {
    ja: "管理者サポートに連絡",
    en: "Contact Admin Support",
    es: "Contactar soporte de administración",
    pt: "Contatar suporte administrativo",
    ko: "관리자 지원에 연락",
    zh: "联系管理员支持",
  },
  contactOwner: {
    ja: "店舗オーナーに連絡",
    en: "Contact Shop Owner",
    es: "Contactar propietario de tienda",
    pt: "Contatar proprietário da loja",
    ko: "가게 주인에게 연락",
    zh: "联系店铺所有者",
  },
  selectShop: {
    ja: "店舗を選択",
    en: "Select Shop",
    es: "Seleccionar tienda",
    pt: "Selecionar loja",
    ko: "가게 선택",
    zh: "选择店铺",
  },
  message: {
    ja: "メッセージ",
    en: "Your Message",
    es: "Tu mensaje",
    pt: "Sua mensagem",
    ko: "메시지",
    zh: "您的消息",
  },
  send: {
    ja: "送信",
    en: "Send",
    es: "Enviar",
    pt: "Enviar",
    ko: "보내기",
    zh: "发送",
  },
  adminSupport: {
    ja: "管理者サポート",
    en: "Admin Support",
    es: "Soporte de administración",
    pt: "Suporte administrativo",
    ko: "관리자 지원",
    zh: "管理员支持",
  },
  shopOwner: {
    ja: "店舗オーナー",
    en: "Shop Owner",
    es: "Propietario de tienda",
    pt: "Proprietário da loja",
    ko: "가게 주인",
    zh: "店铺所有者",
  },
};

function LineSupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLineAppI18n();
  const [lineUserId, setLineUserId] = useState<string>("");
  const [idToken, setIdToken] = useState<string | null>(null);
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

  const langKey = language === 'ja' ? 'ja' : language === 'en' ? 'en' : language === 'es' ? 'es' : language === 'pt' ? 'pt' : language === 'ko' ? 'ko' : language === 'zh' ? 'zh' : 'en';
  const tx = (key: keyof typeof supportTexts) => {
    const entry = supportTexts[key];
    return entry[langKey] || entry.en;
  };

  // Initialize LIFF and get LINE user ID
  useEffect(() => {
    const initLiff = async () => {
      if (typeof window === "undefined" || !window.liff) return;

      try {
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }

        const profile = await window.liff.getProfile();
        if (profile?.userId) {
          setLineUserId(profile.userId);
          const token = window.liff.getIDToken();
          if (token) {
            setIdToken(token);
          }
        }
      } catch (error) {
        console.error("Error initializing LIFF:", error);
      }
    };

    initLiff();
  }, []);

  // Load conversations and shops
  useEffect(() => {
    if (lineUserId && idToken) {
      loadConversations();
      loadCustomerShops();
    }
  }, [lineUserId, idToken]);

  const loadCustomerShops = async () => {
    if (!lineUserId || !idToken) return;

    try {
      setLoadingShops(true);
      const res = await fetch(`${apiUrl}/api/line/liff/bookings`, {
        headers: {
          'x-line-user-id': lineUserId,
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const bookings = Array.isArray(data) ? data : [];
        
        const shopMap = new Map<string, { id: string; name: string }>();
        bookings.forEach((booking: any) => {
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

  const loadConversations = async () => {
    if (!lineUserId || !idToken) return;

    try {
      setLoading(true);
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/conversations`,
        {
          lineUserId,
          idToken,
        }
      );

      if (res.ok) {
        const { conversations: convs } = await res.json();
        setConversations(convs || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!lineUserId || !idToken) return;

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/conversations/${conversationId}`,
        {
          lineUserId,
          idToken,
        }
      );

      if (res.ok) {
        const { conversation, messages: msgs } = await res.json();
        setMessages(msgs || []);
        setSelectedConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createSupportTicket = async () => {
    if (!supportType || !initialMessage.trim() || creating || !lineUserId || !idToken) return;

    if (supportType === 'owner' && !shopId) {
      alert(tx('selectShop'));
      return;
    }

    setCreating(true);
    const content = initialMessage.trim();

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/create`,
        {
          lineUserId,
          idToken,
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
    if (!input.trim() || !selectedConversationId || sending || !lineUserId || !idToken) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/customer/support/conversations/${selectedConversationId}/reply`,
        {
          lineUserId,
          idToken,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Show create ticket form if no conversation selected and no conversations exist
  if (!selectedConversationId && conversations.length === 0 && !supportType) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {tx('title')}
          </h1>
          <p className="text-gray-600 mb-8">
            {tx('description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {tx('contactAdmin')}
              </h2>
              <p className="text-gray-600 mb-4">
                {tx('description')}
              </p>
              <button
                onClick={() => setSupportType('admin')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {tx('send')}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {tx('contactOwner')}
              </h2>
              <p className="text-gray-600 mb-4">
                {tx('description')}
              </p>
              <button
                onClick={() => setSupportType('owner')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {tx('send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show create ticket form
  if (supportType && !selectedConversationId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              setSupportType(null);
              setInitialMessage("");
              setShopId(null);
            }}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            ← {t('back') || 'Back'}
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {supportType === 'admin' 
              ? tx('contactAdmin')
              : tx('contactOwner')}
          </h1>

          {supportType === 'owner' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tx('selectShop')}
              </label>
              {loadingShops ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {t('loading')}
                </div>
              ) : shops.length > 0 ? (
                <select
                  value={shopId || ''}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{tx('selectShop')}</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  {tx('selectShop')}
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tx('message')}
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder={tx('message')}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={createSupportTicket}
            disabled={creating || !initialMessage.trim() || (supportType === 'owner' && !shopId)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? t('loading') : tx('send')}
          </button>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className="w-1/3 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{tx('title')}</h2>
            </div>

            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>{tx('title')}</p>
                <button
                  onClick={() => setSupportType('admin')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {tx('send')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
                {conversations.map((conv) => {
                  const isAdminSupport = !conv.shop_id || conv.shop_id === null || !conv.shop || conv.shop?.name === null;
                  const displayName = isAdminSupport 
                    ? tx('adminSupport')
                    : conv.shop?.name || tx('shopOwner');

                  return (
                    <button
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
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
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow border border-gray-200">
            {selectedConversation ? (
              <>
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedConversation.shop_id && selectedConversation.shop?.name
                          ? selectedConversation.shop.name
                          : tx('adminSupport')}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const isCustomerMessage = msg.isCustomerMessage || 
                      (msg.sender?.source !== 'admin' && msg.sender?.source !== 'owner' && msg.sender?.source !== 'ai');
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCustomerMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isCustomerMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isCustomerMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={tx('message')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={sending || !input.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? t('loading') : tx('send')}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">{tx('title')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LineSupportPage() {
  return (
    <LineSupportPageContent />
  );
}

