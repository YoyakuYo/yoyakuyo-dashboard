// app/browse/components/BrowseAIAssistant.tsx
// AI Assistant component for the public browse page

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { useBrowseAIContext } from '@/app/components/BrowseAIContext';
import { useAIConversation, ConversationIdentity } from '@/lib/useAIConversation';
import { useRouter } from 'next/navigation';
import { getOrCreateGuestId, setGuestId as persistGuestId } from '@/lib/guestId';
import { useAuth } from '@/lib/useAuth';
import { useCustomAuth } from '@/lib/useCustomAuth';

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
  variant?: 'floating' | 'embedded';
  /** When provided, transforms links like /shops/:id to `${shopLinkBasePath}/:id` */
  shopLinkBasePath?: string;
  /** Optional UI text overrides (used by LINE LIFF to fully localize UI without next-intl) */
  uiText?: Partial<{
    title: string;
    openAriaLabel: string;
    closeAriaLabel: string;
    emptyTitle: string;
    emptySubtitle: string;
    tryAsking: string;
    placeholder: string;
    send: string;
  }>;
}

export function BrowseAIAssistant({
  shops = [],
  selectedPrefecture,
  selectedCity,
  selectedCategoryId,
  searchQuery,
  locale = 'en',
  variant = 'floating',
  shopLinkBasePath,
  uiText,
  lineUserId,
  lineCustomerProfileId,
}: BrowseAIAssistantProps & { lineUserId?: string; lineCustomerProfileId?: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { user, session } = useAuth();
  const { user: customUser, session: customSession } = useCustomAuth();
  const browseContext = useBrowseAIContext();
  const shopContext = browseContext?.shopContext;
  const isLineContext = !!lineUserId; // LINE LIFF must always be identified by lineUserId
  const [isOpen, setIsOpen] = useState(variant === 'embedded');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationStateId, setConversationStateId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('yoyakuyo_conversation_state_id');
  });
  const [quickReplies, setQuickReplies] = useState<Array<{ label: string; payload: string }> | null>(null);
  const [shopCards, setShopCards] = useState<Array<{ shop_name: string; address: string | null; href: string; cta: string }> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track conversation history for context
  const [rememberedLocation, setRememberedLocation] = useState<string | null>(null);

  // Stable UUID guest id (shared with booking + guest inbox)
  const [guestId, setGuestId] = React.useState<string | undefined>(() => getOrCreateGuestId() || undefined);
  const [guestIdInput, setGuestIdInput] = useState<string>('');

  function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
  }

  // Use customer mode for LINE users, web customer mode when logged in, guest otherwise
  // Memoize conversationIdentity to prevent unnecessary reloads
  const conversationIdentity: ConversationIdentity = React.useMemo(() => {
    // LINE context: do NOT treat as web customer even if the webview has a leftover web session.
    // Also do NOT use customer_profiles.id as userId (that is NOT the canonical customers.id).
    // We store LIFF "AI tab" conversations as guest-conversations (per-device) while the backend
    // resolves identity correctly via lineUserId.
    if (lineUserId) {
      return {
        userType: 'guest',
        userId: null,
        contextKey: 'line_app',
        shopId: shopContext?.shopId || (shops.length > 0 ? shops[0]?.id : null),
        guestId: guestId,
      };
    }

    // NOTE: Customer/owner login in this app is primarily via CustomAuthProvider (yoyaku_session).
    // Supabase AuthProvider may be empty even when the user is logged in.

    // If LINE customer profile ID is provided, use customer mode with unique context
    if (lineCustomerProfileId) {
      return {
        userType: 'customer',
        userId: lineCustomerProfileId,
        contextKey: 'line_app',
        shopId: shopContext?.shopId || (shops.length > 0 ? shops[0]?.id : null),
        guestId: undefined,
      };
    }

    // If logged in as a web customer via CustomAuthProvider OR Supabase AuthProvider, treat as customer
    const effectiveCustomerId =
      (customUser?.role === 'customer' ? customUser.id : null) ||
      (user?.id || null);

    if (effectiveCustomerId) {
      return {
        userType: 'customer',
        userId: effectiveCustomerId,
        contextKey: 'web_app',
        shopId: shopContext?.shopId || (shops.length > 0 ? shops[0]?.id : null),
        guestId: undefined,
      };
    }

    // Otherwise, guest mode
    return {
      userType: 'guest',
      userId: null,
      contextKey: 'public_landing',
      shopId: shopContext?.shopId || (shops.length > 0 ? shops[0]?.id : null),
      guestId: guestId,
    };
  }, [lineUserId, lineCustomerProfileId, customUser?.id, customUser?.role, user?.id, shopContext?.shopId, shops.length > 0 ? shops[0]?.id : null, guestId]);

  const { messages: conversationMessages, addMessage, setMessages, saveConversation } = useAIConversation(conversationIdentity);

  // Convert conversationMessages to Message format for UI
  const messages: Message[] = conversationMessages.map((msg: any) => ({
    id: msg.timestamp || `msg-${Date.now()}-${Math.random()}`,
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
    timestamp: new Date(msg.timestamp),
  }));

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

  // Keep guest ID input in sync (guest only)
  useEffect(() => {
    if (conversationIdentity.userType === 'guest') {
      setGuestIdInput(guestId || '');
    }
  }, [conversationIdentity.userType, guestId]);

  // Conversation history is loaded automatically by useAIConversation hook
  // No need for manual loading

  // Note: Auto-greeting removed - let the AI handle greetings naturally based on user input
  // This prevents duplicate greetings and ensures consistent responses

  const loadConversationHistory = async () => {
    // BrowseAIAssistant uses ai_conversations with user_type='guest'
    // This is handled by the useAIConversation hook, so we don't need to load manually
    // The hook will load from ai_conversations automatically
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

    // Store input value before clearing
    const userMessageContent = input.trim();
    
    // Clear input immediately to prevent it from disappearing
    setInput('');
    setLoading(true);
    setError(null);
    setQuickReplies(null);
    setShopCards(null);

    // CRITICAL: Save user message IMMEDIATELY before calling API
    // This ensures user messages are persisted even if API call fails
    await addMessage('user', userMessageContent);
    
    // Small delay to ensure save completes (non-blocking but helps with race conditions)
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Build conversation history from previous messages (last 10 for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      // Build messages array for unified endpoint
      const messagesForAPI = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessageContent },
      ];

      const requestBody: any = {
        role: 'customer',
        messages: messagesForAPI,
        locale: locale,
        prefecture: selectedPrefecture || null,
        category: selectedCategoryId || null,
        searchQuery: searchQuery || null,
        // Identity:
        // - LINE (LIFF): lineUserId (canonical for line -> customers.id mapping)
        // - LINE (legacy): lineCustomerProfileId (customer_profiles.id) - do NOT use for canonical identity
        // - WEB (custom auth): customUser.id
        // - WEB (supabase auth): user.id (fallback)
        // - GUEST: guestId only
        userId:
          (isLineContext ? undefined : lineCustomerProfileId) ||
          (customUser?.role === 'customer' ? customUser.id : undefined) ||
          user?.id ||
          undefined,
        customerId:
          (isLineContext ? undefined : lineCustomerProfileId) ||
          (customUser?.role === 'customer' ? customUser.id : undefined) ||
          user?.id ||
          undefined,
        // LINE LIFF canonical identity (required to avoid misclassification as web_customer)
        lineUserId: isLineContext ? lineUserId : undefined,
        // Send guestId ONLY when not logged in (prevents guest mis-classification)
        guestId:
          !isLineContext && !lineCustomerProfileId && !(customUser?.role === 'customer' && customUser?.id) && !user?.id
            ? guestId
            : undefined,
        conversation_state_id: conversationStateId || undefined,
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
      };

      // Add shop context if available.
      // Fallback: if this assistant is embedded for a single shop (e.g. booking page),
      // use that shop as the active context so the AI can greet "Welcome to {shopName}".
      const effectiveShopContext =
        shopContext?.shopId
          ? shopContext
          : shops.length === 1
          ? {
              shopId: shops[0].id,
              shopName: shops[0].name,
              prefecture: shops[0].prefecture || null,
              address: shops[0].address || null,
            }
          : null;

      if (effectiveShopContext?.shopId) {
        requestBody.shopContext = {
          shopId: effectiveShopContext.shopId,
          shopName: effectiveShopContext.shopName,
          category: (effectiveShopContext as any).category ?? null,
          prefecture: (effectiveShopContext as any).prefecture ?? null,
          address: (effectiveShopContext as any).address ?? null,
          ownerId: (effectiveShopContext as any).ownerId ?? null,
          services: (effectiveShopContext as any).services ?? null,
        };
      }

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // IMPORTANT:
          // - In LINE LIFF, do NOT forward any web auth tokens (a webview can have leftover cookies),
          //   because LINE identity must be resolved via lineUserId.
          ...(!isLineContext
            ? session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : customSession?.token
              ? { Authorization: `Bearer ${customSession.token}` }
              : {}
            : {}),
        },
        body: JSON.stringify(requestBody),
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

      if (data.conversation_state_id && typeof data.conversation_state_id === 'string') {
        setConversationStateId(data.conversation_state_id);
        try {
          localStorage.setItem('yoyakuyo_conversation_state_id', data.conversation_state_id);
        } catch {}
      }

      setQuickReplies(Array.isArray(data.quick_replies) ? data.quick_replies : null);
      setShopCards(Array.isArray(data.shop_cards) ? data.shop_cards : null);
      
      // Add AI message to conversation (optimistic update)
      addMessage('assistant', messageContent);
    } catch (err: any) {
      console.error('[BrowseAIAssistant] Error sending message to AI:', err);
      console.error('[BrowseAIAssistant] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Failed to send message. Please try again.');
      
      const errorMessage = err.message?.includes('OpenAI API key') 
        ? 'AI service is currently unavailable. Please try again later.'
        : 'Sorry, I encountered an error. Please try again.';
      
      addMessage('assistant', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = async (payload: string) => {
    if (!payload.trim() || loading) return;

    const userMessageContent = payload.trim();
    setLoading(true);
    setError(null);
    setQuickReplies(null);
    setShopCards(null);

    await addMessage('user', userMessageContent);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      const messagesForAPI = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessageContent },
      ];

      const requestBody: any = {
        role: 'customer',
        messages: messagesForAPI,
        locale: locale,
        userId:
          (isLineContext ? undefined : lineCustomerProfileId) ||
          (customUser?.role === 'customer' ? customUser.id : undefined) ||
          user?.id ||
          undefined,
        customerId:
          (isLineContext ? undefined : lineCustomerProfileId) ||
          (customUser?.role === 'customer' ? customUser.id : undefined) ||
          user?.id ||
          undefined,
        lineUserId: isLineContext ? lineUserId : undefined,
        guestId:
          !isLineContext && !lineCustomerProfileId && !(customUser?.role === 'customer' && customUser?.id) && !user?.id
            ? guestId
            : undefined,
        conversation_state_id: conversationStateId || undefined,
      };

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(!isLineContext
            ? session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : customSession?.token
              ? { Authorization: `Bearer ${customSession.token}` }
              : {}
            : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      let messageContent = data.response || 'Sorry, I could not generate a response.';

      if (data.conversation_state_id && typeof data.conversation_state_id === 'string') {
        setConversationStateId(data.conversation_state_id);
        try {
          localStorage.setItem('yoyakuyo_conversation_state_id', data.conversation_state_id);
        } catch {}
      }

      setQuickReplies(Array.isArray(data.quick_replies) ? data.quick_replies : null);
      setShopCards(Array.isArray(data.shop_cards) ? data.shop_cards : null);

      await addMessage('assistant', messageContent);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
      await addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
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

  const ui = {
    title: uiText?.title ?? 'AI Assistant',
    openAriaLabel: uiText?.openAriaLabel ?? 'Open AI Assistant',
    closeAriaLabel: uiText?.closeAriaLabel ?? 'Close chat',
    emptyTitle: uiText?.emptyTitle ?? "Hi! I'm your AI assistant.",
    emptySubtitle: uiText?.emptySubtitle ?? 'I can help you find shops by category or preferences.',
    tryAsking: uiText?.tryAsking ?? 'Try asking:',
    placeholder: uiText?.placeholder ?? 'Ask me about shops...',
    send: uiText?.send ?? 'Send',
  };

  const isEmbedded = variant === 'embedded';

  return (
    <>
      {/* Chat Bubble Button */}
      {!isEmbedded && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label={ui.openAriaLabel}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={
            isEmbedded
              ? "w-full max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col"
              : "fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50"
          }
          style={isEmbedded ? { height: "70vh" } : undefined}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">{ui.title}</h3>
            </div>
            {!isEmbedded && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label={ui.closeAriaLabel}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Guest ID panel (guest only) */}
          {!isLineContext && !lineCustomerProfileId && !(customUser?.role === 'customer' && customUser?.id) && !user?.id && (
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 font-semibold">Guest ID</p>
                  <p className="text-[11px] text-gray-700 font-mono break-all">{guestId || '—'}</p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Save this ID. You can paste it later to restore your name and history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (guestId) navigator.clipboard.writeText(guestId);
                  }}
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  value={guestIdInput}
                  onChange={(e) => setGuestIdInput(e.target.value)}
                  placeholder="Paste your Guest ID"
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = guestIdInput.trim();
                    if (!isUuid(v)) {
                      alert('Please paste a valid Guest ID (UUID).');
                      return;
                    }
                    persistGuestId(v);
                    setGuestId(v);
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Use ID
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                <div className="text-4xl mb-4">🤖</div>
                <p className="font-medium mb-2">{ui.emptyTitle}</p>
                <p className="text-xs mb-4">{ui.emptySubtitle}</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">{ui.tryAsking}</p>
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
                        const sid = part.replace('/shops/', '');
                        const targetHref = shopLinkBasePath ? `${shopLinkBasePath}/${sid}` : part;
                        return (
                          <a
                            key={idx}
                            href={targetHref}
                            className="text-purple-600 hover:text-purple-800 underline font-semibold"
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(targetHref);
                            }}
                          >
                            {targetHref}
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

          {/* Button-led flow: shop cards */}
          {shopCards && shopCards.length > 0 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="space-y-2">
                {shopCards.map((c, idx) => (
                  <a
                    key={`${c.href}-${idx}`}
                    href={shopLinkBasePath ? `${shopLinkBasePath}${c.href.replace('/shops', '')}` : c.href}
                    className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-semibold text-gray-900">{c.shop_name}</div>
                    {c.address && <div className="text-xs text-gray-600 mt-1">{c.address}</div>}
                    <div className="text-xs text-purple-700 font-semibold mt-2">{c.cta || 'View Shop'}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Button-led flow: quick replies */}
          {quickReplies && quickReplies.length > 0 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={`${qr.payload}-${idx}`}
                    type="button"
                    onClick={() => handleQuickReply(qr.payload)}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                placeholder={ui.placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
              >
                {loading ? '...' : ui.send}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

