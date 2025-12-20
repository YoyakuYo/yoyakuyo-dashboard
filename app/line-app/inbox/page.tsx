"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { messagingFetch } from "@/app/lib/messagingApiClient";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for realtime
let supabase: ReturnType<typeof createClient> | null = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('[LINE Inbox] Supabase env vars not configured, realtime disabled');
  }
} catch (error) {
  console.error('[LINE Inbox] Failed to initialize Supabase client:', error);
}

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

interface Conversation {
  id: string;
  shop_id: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  };
  last_message_at?: string;
  created_at: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'shop';
  body?: string;
  content?: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed'; // STEP 1: Optimistic message status
}

function LineInboxPageContent() {
  const [realtimeDebug, setRealtimeDebug] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShopId = searchParams.get('shop_id');
  const preselectedBookingId = searchParams.get('booking_id');
  const preselectedLineUserId = searchParams.get('line_user_id');
  
  const [lineUserId, setLineUserId] = useState<string>("");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null); // STEP 5: Scroll management
  const realtimeChannelRef = useRef<any>(null); // STEP 3: Realtime subscription
  // STEP 3: Lock conversation ID in a stable ref
  const lockedConversationIdRef = useRef<string | null>(null);
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('line_app_language') || 'ja';
    }
    return 'ja';
  });

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      setLanguage(e.detail.language);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('lineAppLanguageChanged', handleLanguageChange as EventListener);
      return () => {
        window.removeEventListener('lineAppLanguageChanged', handleLanguageChange as EventListener);
      };
    }
  }, []);

  // Initialize LIFF and load conversations
  useEffect(() => {
    const initLIFF = async () => {
      if (typeof window === "undefined" || !window.liff) {
        setError("LINE app is not available");
        setLoading(false);
        return;
      }

      try {
        const profile = await window.liff.getProfile();
        const token = await window.liff.getIDToken();
        setLineUserId(profile.userId);
        setIdToken(token);
        
        // STEP 1: Verify LINE user ID matches (if provided)
        if (preselectedLineUserId && preselectedLineUserId !== profile.userId) {
          console.error("[LINE Inbox] ❌ LINE user ID mismatch:", {
            provided: preselectedLineUserId,
            actual: profile.userId,
          });
          setError('User authentication mismatch. Please try again.');
          setLoading(false);
          return;
        }
        
        // Load conversations
        await loadConversations(profile.userId, token);
        
        // STEP 2: If shop_id is preselected, resolve/create conversation with booking_id
        if (preselectedShopId) {
          await handlePreselectedShop(preselectedShopId, profile.userId, token, preselectedBookingId || undefined);
        }
      } catch (error: any) {
        console.error("[LINE Inbox] Failed to initialize:", error);
        setError(`Failed to initialize: ${error.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    initLIFF();
  }, [preselectedShopId]);

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('line_app_language') || 'ja';
      setLanguage(storedLang);
    }
  }, []);

  const loadConversations = async (lineUserId: string, token: string) => {
    try {
      setLoading(true);
      console.log("[LINE Inbox] Loading conversations for LINE user:", lineUserId);
      
      // ALWAYS inject X-User-Id via unified messaging API client
      // Rely on backend auth context to resolve customer_type/customer_ref
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations`,
        {
          lineUserId,
          idToken: token,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to load conversations' }));
        throw new Error(errorData.error || 'Failed to load conversations');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Loaded conversations:", data.conversations?.length || 0);
      
      // CRITICAL: Deduplicate by shop_id - keep only the latest conversation per shop
      const rawConversations: Conversation[] = data.conversations || [];
      const byShop = new Map<string, Conversation>();
      for (const conv of rawConversations) {
        const key = conv.shop_id;
        const existing = byShop.get(key);
        if (!existing) {
          byShop.set(key, conv);
        } else {
          // Keep the one with latest last_message_at (or created_at if no messages)
          const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
          const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
          if (newTime > existingTime) {
            byShop.set(key, conv);
          }
        }
      }
      const deduped = Array.from(byShop.values()).sort((a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      );
      console.log("[LINE Inbox] Deduplicated conversations:", deduped.length, "from", rawConversations.length);
      setConversations(deduped);
    } catch (error: any) {
      console.error("[LINE Inbox] Error loading conversations:", error);
      setError(`Failed to load conversations: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL: Find existing conversation - check list first, then backend if needed
  const handlePreselectedShop = async (shopId: string, lineUserId: string, token: string, bookingId?: string) => {
    try {
      console.log("[LINE Inbox] Handling preselected shop (FETCH ONLY, NO CREATE):", { shopId, bookingId });
      
      // FIRST: Check already-loaded conversations list
      let existingConv = conversations.find(c => c.shop_id === shopId);
      
      // SECOND: If not in list, check backend (conversation might exist but not be in list yet)
      if (!existingConv) {
        console.log("[LINE Inbox] Not in list, checking backend for existing conversation...");
        try {
          const res = await messagingFetch(
            `${apiUrl}/api/internal-messaging/conversations`,
            {
              lineUserId,
              idToken: token,
            }
          );
          
          if (res.ok) {
            const data = await res.json();
            const allConversations: Conversation[] = data.conversations || [];
            existingConv = allConversations.find(c => c.shop_id === shopId);
            
            // Update conversations list with backend data (deduplicated)
            const byShop = new Map<string, Conversation>();
            for (const conv of allConversations) {
              const key = conv.shop_id;
              const existing = byShop.get(key);
              if (!existing) {
                byShop.set(key, conv);
              } else {
                const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
                const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
                if (newTime > existingTime) {
                  byShop.set(key, conv);
                }
              }
            }
            const deduped = Array.from(byShop.values()).sort((a, b) =>
              new Date(b.last_message_at || b.created_at).getTime() -
              new Date(a.last_message_at || a.created_at).getTime()
            );
            setConversations(deduped);
            
            // Re-check after updating list
            existingConv = deduped.find(c => c.shop_id === shopId);
          }
        } catch (fetchError) {
          console.error("[LINE Inbox] Error checking backend for conversation:", fetchError);
        }
      }
      
      if (!existingConv) {
        console.log("[LINE Inbox] No existing conversation found in DB for shop:", shopId);
        // DO NOT CREATE - show message that user can send first message
        setError("");
        setSelectedConversation(null);
        setMessages([]);
        return;
      }
      
      console.log("[LINE Inbox] ✅ Found existing conversation:", existingConv.id);
      
      // Use the existing conversation - set state and load messages
      setSelectedConversation(existingConv);
      lockedConversationIdRef.current = existingConv.id;
      await loadMessages(existingConv.id, lineUserId, token);
      
      // Set up realtime subscription for this conversation
      subscribeToMessages(existingConv.id);
      
      // Focus message input after a short delay
      setTimeout(() => {
        const input = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
        if (input) {
          input.focus();
        }
      }, 300);
    } catch (error: any) {
      console.error("[LINE Inbox] ❌ Error handling preselected shop:", error);
      setError(`Failed to open conversation: ${error.message || 'Unknown error'}`);
    }
  };

  const loadMessages = async (conversationId: string, lineUserId: string, token: string) => {
    try {
      setLoadingMessages(true);
      console.log("[LINE Inbox] Loading messages for conversation:", conversationId);
      
      // ALWAYS inject X-User-Id via unified messaging API client
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/conversations/${conversationId}/messages`,
        {
          lineUserId,
          idToken: token,
        }
      );

      if (!res.ok) {
        if (res.status === 403) {
          setError('Not authorized to view messages. Please ensure you are logged in correctly.');
          // STEP 4: Keep current conversation_id, show error state instead
          // DO NOT reset messages or conversation
          return;
        } else if (res.status === 401) {
          setError('Authentication required. Please log in again.');
          // STEP 4: Keep current conversation_id, show error state instead
          return;
        }
        throw new Error('Failed to load messages');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Loaded messages:", data.messages?.length || 0);
      console.log("[LINE Inbox] Sample message:", data.messages?.[0]);
      
      // STEP 4: Message state MUST APPEND, NOT REPLACE - merge with existing
      setMessages(prev => {
        // Keep messages with status 'sending' or 'failed' (optimistic messages)
        const optimisticMessages = prev.filter(m => m.status === 'sending' || m.status === 'failed');
        // Merge with fetched messages, avoiding duplicates
        const fetchedMessages = (data.messages || []).filter((newMsg: Message) => 
          !prev.some(existing => existing.id === newMsg.id)
        );
        const merged = [...optimisticMessages, ...fetchedMessages].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        console.log("[LINE Inbox] [BUG CHECK] messages.length AFTER loadMessages merge:", merged.length);
        console.log("[LINE Inbox] [BUG CHECK] last message ID AFTER loadMessages merge:", merged[merged.length - 1]?.id);
        return merged;
      });
      
      setError(""); // Clear error on success
      
      // STEP 5: Auto-scroll to bottom after loading
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error("[LINE Inbox] Error loading messages:", error);
      setError(`Failed to load messages: ${error.message || 'Unknown error'}`);
      // STEP 4: Keep current conversation_id, show error state instead
      // DO NOT reset messages or conversation
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    // Block send if content is empty or whitespace
    if (!newMessage || !newMessage.trim() || !lineUserId || !idToken || sending) {
      if (!newMessage || !newMessage.trim()) {
        console.warn("[LINE Inbox] Cannot send empty message");
      }
      return;
    }

    // CRITICAL: Reuse existing conversation if available, only create if truly doesn't exist
    let conversationId: string;
    let conversationToUse: Conversation | null = selectedConversation;

    // If no selected conversation, check if one exists in the list for this shop
    if (!conversationToUse) {
      // Determine which shop we're messaging
      const shopId = preselectedShopId || (conversations.length > 0 ? conversations[0].shop_id : null);
      
      if (!shopId) {
        setError('Cannot send message: No shop selected and no conversation exists.');
        return;
      }

      // FIRST: Check if conversation already exists in list (by shop_id)
      let existingConv = conversations.find(c => c.shop_id === shopId);
      
      // SECOND: If not in list, check backend (conversation might exist but not be loaded)
      if (!existingConv) {
        console.log("[LINE Inbox] Not in list, checking backend for existing conversation...");
        try {
          const res = await messagingFetch(
            `${apiUrl}/api/internal-messaging/conversations`,
            {
              lineUserId,
              idToken,
            }
          );
          
          if (res.ok) {
            const data = await res.json();
            const allConversations: Conversation[] = data.conversations || [];
            existingConv = allConversations.find(c => c.shop_id === shopId);
            
            if (existingConv) {
              // Update conversations list with backend data (deduplicated)
              const byShop = new Map<string, Conversation>();
              for (const conv of allConversations) {
                const key = conv.shop_id;
                const existing = byShop.get(key);
                if (!existing) {
                  byShop.set(key, conv);
                } else {
                  const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
                  const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
                  if (newTime > existingTime) {
                    byShop.set(key, conv);
                  }
                }
              }
              const deduped = Array.from(byShop.values()).sort((a, b) =>
                new Date(b.last_message_at || b.created_at).getTime() -
                new Date(a.last_message_at || a.created_at).getTime()
              );
              setConversations(deduped);
              
              // Re-check after updating list
              existingConv = deduped.find(c => c.shop_id === shopId);
            }
          }
        } catch (fetchError) {
          console.error("[LINE Inbox] Error checking backend for conversation:", fetchError);
        }
      }
      
      if (existingConv) {
        // Reuse existing conversation - DO NOT CREATE
        console.log("[LINE Inbox] Found existing conversation, reusing:", existingConv.id);
        conversationToUse = existingConv;
        conversationId = existingConv.id;
        setSelectedConversation(existingConv);
        lockedConversationIdRef.current = existingConv.id;
        
        // Load messages for this conversation if not already loaded
        if (messages.length === 0 || messages[0]?.conversation_id !== existingConv.id) {
          await loadMessages(existingConv.id, lineUserId, idToken);
        }
        
        // Ensure realtime subscription is active for this conversation
        subscribeToMessages(existingConv.id);
      } else {
        // NO conversation exists anywhere - create ONLY when sending first message
        console.log("[LINE Inbox] No conversation exists anywhere, creating ONLY because user is sending first message:", shopId);
        
        try {
          const convRes = await messagingFetch(
            `${apiUrl}/api/internal-messaging/conversations`,
            {
              method: 'POST',
              lineUserId,
              idToken,
              body: {
                shop_id: shopId,
                booking_id: preselectedBookingId || null,
                customer_type: 'line',
                customer_ref: lineUserId,
              },
            }
          );

          if (!convRes.ok) {
            const errorData = await convRes.json().catch(() => ({ error: 'Failed to create conversation' }));
            throw new Error(errorData.error || 'Failed to create conversation');
          }

          const convData = await convRes.json();
          conversationId = convData.conversation_id;
          
          const shop = convData.shop || convData.conversation?.shop;
          conversationToUse = {
            id: conversationId,
            shop_id: shopId,
            shop: shop || { id: shopId, name: 'Shop' },
            created_at: convData.conversation?.created_at || new Date().toISOString(),
          };
          
          // Add to conversations list with proper deduplication
          setConversations(prev => {
            // CRITICAL: Deduplicate by shop_id - only one conversation per shop
            const byShop = new Map<string, Conversation>();
            // Add existing conversations
            for (const conv of prev) {
              const key = conv.shop_id;
              const existing = byShop.get(key);
              if (!existing) {
                byShop.set(key, conv);
              } else {
                // Keep the one with latest last_message_at
                const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
                const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
                if (newTime > existingTime) {
                  byShop.set(key, conv);
                }
              }
            }
            // Add new conversation (will replace if shop_id exists)
            byShop.set(shopId, conversationToUse!);
            
            const deduped = Array.from(byShop.values()).sort((a, b) =>
              new Date(b.last_message_at || b.created_at).getTime() -
              new Date(a.last_message_at || a.created_at).getTime()
            );
            return deduped;
          });
          
          setSelectedConversation(conversationToUse);
          lockedConversationIdRef.current = conversationId;
          
          // Set up realtime subscription for the new conversation
          subscribeToMessages(conversationId);
          
          console.log("[LINE Inbox] ✅ Created conversation for first message:", conversationId);
        } catch (error: any) {
          console.error("[LINE Inbox] ❌ Failed to create conversation:", error);
          setError(`Failed to create conversation: ${error.message || 'Unknown error'}`);
          return;
        }
      }
    } else {
      // CRITICAL: Use the EXACT conversation_id from selectedConversation - never change it
      conversationId = conversationToUse.id;
      // CRITICAL: Lock conversation_id - never let it change
      lockedConversationIdRef.current = conversationId;
      
      // CRITICAL: Ensure selectedConversation matches - never replace it
      if (selectedConversation?.id !== conversationId) {
        console.warn("[LINE Inbox] ⚠️ Conversation ID mismatch! Using locked ID:", conversationId);
        setSelectedConversation(conversationToUse);
      }
    }

    // CRITICAL: Final verification - conversation_id must match locked ID
    if (lockedConversationIdRef.current && lockedConversationIdRef.current !== conversationId) {
      console.error("[LINE Inbox] ❌ CRITICAL: conversation_id changed! Using locked ID instead");
      conversationId = lockedConversationIdRef.current;
      // Find conversation by locked ID
      const lockedConv = conversations.find(c => c.id === conversationId) || selectedConversation;
      if (lockedConv) {
        conversationToUse = lockedConv;
        setSelectedConversation(lockedConv);
      }
    }

    // CRITICAL: Ensure realtime subscription is ALWAYS active before sending
    if (conversationId && !realtimeChannelRef.current) {
      console.log("[LINE Inbox] Realtime subscription missing, setting up now:", conversationId);
      subscribeToMessages(conversationId);
    }

    // STEP 1: VERIFY THE ACTUAL BUG - Log conversation_id BEFORE send
    const conversationIdBeforeSend = conversationId;
    const lockedIdBeforeSend = lockedConversationIdRef.current;
    console.log("[LINE Inbox] [BUG CHECK] conversation_id BEFORE send:", conversationIdBeforeSend);
    console.log("[LINE Inbox] [BUG CHECK] lockedConversationIdRef BEFORE send:", lockedIdBeforeSend);
    console.log("[LINE Inbox] [BUG CHECK] selectedConversation.id BEFORE send:", conversationToUse?.id);
    console.log("[LINE Inbox] [BUG CHECK] messages.length BEFORE send:", messages.length);
    console.log("[LINE Inbox] [BUG CHECK] last message ID BEFORE send:", messages[messages.length - 1]?.id);
    console.log("[LINE Inbox] [SUBSCRIPTION] Realtime channel exists:", !!realtimeChannelRef.current);
    console.log("[LINE Inbox] [SUBSCRIPTION] Realtime channel state:", realtimeChannelRef.current?.state);

    const trimmedContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // STEP 1: Optimistic message insert - immediately append to local state
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_type: 'customer',
      content: trimmedContent,
      created_at: new Date().toISOString(),
      status: 'sending',
    };
    
    // STEP 4: Message state MUST APPEND, NOT REPLACE
    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      console.log("[LINE Inbox] [BUG CHECK] messages.length AFTER optimistic insert:", newMessages.length);
      return newMessages;
    });
    setNewMessage('');
    
    // STEP 5: Auto-scroll to bottom after optimistic insert
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      setSending(true);
      console.log("[LINE Inbox] Sending message to conversation:", conversationId, {
        contentLength: trimmedContent.length,
        tempId,
      });
      
      // ALWAYS inject X-User-Id via unified messaging API client
      const res = await messagingFetch(
        `${apiUrl}/api/internal-messaging/messages`,
        {
          method: 'POST',
          lineUserId,
          idToken,
          body: {
            conversation_id: conversationId,
            content: trimmedContent,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await res.json();
      console.log("[LINE Inbox] Message sent successfully:", data.message?.id);
      
      // STEP 1: VERIFY THE ACTUAL BUG - Log conversation_id AFTER send
      console.log("[LINE Inbox] [BUG CHECK] conversation_id AFTER send:", conversationId);
      console.log("[LINE Inbox] [BUG CHECK] lockedConversationIdRef AFTER send:", lockedConversationIdRef.current);
      console.log("[LINE Inbox] [BUG CHECK] selectedConversation.id AFTER send:", conversationToUse?.id);
      
      // STEP 2: Replace temp message with real message ID
      // STEP 4: Message state MUST APPEND, NOT REPLACE - use map to update existing
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === tempId 
            ? { ...data.message, status: 'sent' as const }
            : msg
        );
        console.log("[LINE Inbox] [BUG CHECK] messages.length AFTER replace temp:", updated.length);
        console.log("[LINE Inbox] [BUG CHECK] last message ID AFTER replace temp:", updated[updated.length - 1]?.id);
        return updated;
      });
      
      // STEP 5: Auto-scroll to bottom after real message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // CRITICAL: DO NOT refresh conversations list or messages after send
      // Rely ONLY on Supabase realtime for AI responses
      // This prevents state resets and conversation switching
    } catch (error: any) {
      console.error("[LINE Inbox] Error sending message:", error);
      
      // STEP 2: Mark message as failed, DO NOT reset conversation
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      
      setError(`Failed to send message: ${error.message || 'Unknown error'}`);
      // DO NOT alert - show error in UI instead
    } finally {
      setSending(false);
    }
  };

  // STEP 5: Subscribe to realtime updates for new messages
  const subscribeToMessages = useCallback((conversationId: string) => {
    if (!supabase) {
      console.warn("[LINE Inbox] Supabase client not initialized, skipping realtime");
      return;
    }

    // CRITICAL: Always use locked conversation_id, not the parameter
    const lockedId = lockedConversationIdRef.current || conversationId;
    if (!lockedId) {
      console.warn("[LINE Inbox] No conversation ID to subscribe to");
      return;
    }

    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    console.log("[LINE Inbox] Subscribing to realtime updates for conversation:", lockedId);
    console.log("[LINE Inbox] [SUBSCRIPTION] Setting up subscription for conversation_id:", lockedId);
    
    const channel = supabase
      .channel(`messages:conversation_id=eq.${lockedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${lockedId}`,
        },
        (payload) => {
          console.log("[LINE Inbox] New message received via realtime:", payload.new);
          const newMessage = payload.new as any;
          
          // CRITICAL: Use current locked ID from ref (not closure) to verify
          // Subscription filter already ensures conversation_id matches, but double-check with current ref
          const currentLockedId = lockedConversationIdRef.current;
          if (currentLockedId && newMessage.conversation_id !== currentLockedId) {
            console.log("[LINE Inbox] ⚠️ Realtime message ignored - conversation_id mismatch:", {
              messageConversationId: newMessage.conversation_id,
              subscriptionLockedId: lockedId,
              currentLockedId: currentLockedId,
            });
            return;
          }
          
          // CRITICAL: If no locked ID, still accept if it matches subscription filter
          // (This handles edge case where ref hasn't been set yet)
          if (!currentLockedId && newMessage.conversation_id !== lockedId) {
            console.log("[LINE Inbox] ⚠️ Realtime message ignored - no locked ID and doesn't match subscription");
            return;
          }
          
          // [MANDATORY] AI message received, appending to state (for live debug requirement)
          console.log("[MANDATORY] AI message received, appending to state:", newMessage);
          console.log("[MANDATORY] sender_type:", newMessage.sender_type, "sender_role:", (newMessage as any).sender_role);

          // CRITICAL: Use functional state update to avoid stale closure
          setMessages((prev) => {
            console.log("[LINE Inbox] [RENDER CHECK] setMessages called, prev.length:", prev.length);
            
            // Check if message already exists (avoid duplicates)
            if (prev.some((msg) => msg.id === newMessage.id)) {
              console.log("[LINE Inbox] Message already exists, skipping:", newMessage.id);
              setRealtimeDebug(`[SKIP] Already exist: ${newMessage.id}`);
              return prev; // Return same reference if duplicate
            }
            
            setRealtimeDebug(`AI msg: ${newMessage.id} added, messages now: ${prev.length + 1}`);
            
            // CRITICAL: Create new array - never mutate prev
            const formattedMessage: Message = {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              sender_type: newMessage.sender_type || 'shop', // Accept AI/owner/shop messages
              body: newMessage.body || newMessage.content,
              content: newMessage.content || newMessage.body,
              created_at: newMessage.created_at,
              status: 'sent',
            };
            
            console.log("[LINE Inbox] Adding new message from realtime:", formattedMessage.id);
            
            // CRITICAL: Create new array reference - React will detect this change
            const updated = [...prev, formattedMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            console.log("[LINE Inbox] [RENDER CHECK] messages.length AFTER realtime append:", updated.length);
            console.log("[LINE Inbox] [RENDER CHECK] returning NEW array reference");
            return updated; // Return new array reference
          });
          
          // STEP 5: Auto-scroll to bottom when AI message arrives
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log("[LINE Inbox] [SUBSCRIPTION] Realtime subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("[LINE Inbox] [SUBSCRIPTION] ✅ Successfully subscribed to conversation:", lockedId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error("[LINE Inbox] [SUBSCRIPTION] ❌ Channel error for conversation:", lockedId);
        }
      });

    realtimeChannelRef.current = channel;
    console.log("[LINE Inbox] [SUBSCRIPTION] Channel stored in ref, conversation_id:", lockedId);
  }, []);
  
  const handleSelectConversation = async (conv: Conversation) => {
    // STEP 3: Lock conversation ID in a stable ref
    lockedConversationIdRef.current = conv.id;
    console.log("[LINE Inbox] [BUG CHECK] Locked conversation_id:", conv.id);
    
    setSelectedConversation(conv);
    if (lineUserId && idToken) {
      await loadMessages(conv.id, lineUserId, idToken);
      // STEP 5: Subscribe to realtime updates for this conversation
      subscribeToMessages(conv.id);
    }
  };
  
  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current && supabase) {
        console.log("[LINE Inbox] Cleaning up realtime subscription");
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);
  
  // CRITICAL: Auto-open conversation if there's exactly one and no preselected shop
  useEffect(() => {
    // Only auto-open if: exactly 1 conversation, no conversation selected, no preselected shop, and we have auth
    if (conversations.length === 1 && !selectedConversation && !preselectedShopId && lineUserId && idToken && !loading) {
      const singleConv = conversations[0];
      console.log("[LINE Inbox] Auto-opening single conversation:", singleConv.id);
      lockedConversationIdRef.current = singleConv.id;
      setSelectedConversation(singleConv);
      // Load messages and subscribe immediately
      (async () => {
        await loadMessages(singleConv.id, lineUserId, idToken);
        subscribeToMessages(singleConv.id);
      })();
    }
  }, [conversations.length, preselectedShopId, lineUserId, idToken, loading]);

  // STEP 5: Subscribe to realtime when conversation is selected
  useEffect(() => {
    if (selectedConversation && lineUserId && idToken) {
      // STEP 3: Use locked conversation ID, never recalculate
      const conversationId = lockedConversationIdRef.current || selectedConversation.id;
      if (conversationId) {
        subscribeToMessages(conversationId);
      }
    }
    
    return () => {
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [selectedConversation?.id, lineUserId, idToken]);
  
  // CRITICAL: Render logging to verify React detects state changes
  useEffect(() => {
    const lastMsgId = messages[messages.length - 1]?.id;
    const lastMsgSender = messages[messages.length - 1]?.sender_type;
    const convId = selectedConversation?.id;
    const lockedId = lockedConversationIdRef.current;
    console.log("[LINE Inbox] [RENDER CHECK] Component re-rendered - messages.length:", messages.length, 
      "last message ID:", lastMsgId, 
      "last sender:", lastMsgSender,
      "selectedConversation.id:", convId, 
      "lockedConversationIdRef:", lockedId);
    console.log("[LINE Inbox] [RENDER CHECK] All message IDs:", messages.map(m => ({ id: m.id, sender: m.sender_type })));
  }, [messages, selectedConversation?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{language === 'ja' ? '読み込み中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {realtimeDebug && (
        <div style={{
          position: 'fixed', bottom: 10, left: 0, right: 0,
          background: '#f6e05e', color: '#222', padding: 8, fontWeight: 'bold', zIndex: 9999, textAlign: 'center',
        }}>
          {realtimeDebug}
        </div>
      )}
      <div className="bg-gray-50 flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>


        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">{language === 'ja' ? '受信箱' : 'Inbox'}</h1>
              <button
                onClick={() => router.push("/line-app")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {language === 'ja' ? '戻る' : 'Back'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="px-4 py-2 flex-shrink-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 px-2 md:px-4 py-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Mobile Conversations List (full-width) - Only show if 2+ conversations */}
            {conversations.length >= 2 && (
              <div className="md:hidden border-b border-gray-200">
                <div className="p-3 flex-shrink-0">
                  <h2 className="font-semibold text-gray-900 text-sm">
                    {language === 'ja' ? '会話を選択' : 'Select a conversation'}
                  </h2>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.shop?.name || 'Shop'}
                        </h3>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.last_message_at && (
                        <p className="text-xs text-gray-400">
                          {new Date(conv.last_message_at).toLocaleString()}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-1 min-h-0" style={{ height: '100%' }}>
              {/* Desktop Conversations List - Only show if 2+ conversations */}
              {conversations.length >= 2 && (
                <div className="w-1/3 border-r border-gray-200 flex flex-col min-w-0 hidden md:flex">
                <div className="p-3 border-b border-gray-200 flex-shrink-0">
                  <h2 className="font-semibold text-gray-900 text-sm">{language === 'ja' ? '会話' : 'Conversations'}</h2>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">{language === 'ja' ? '会話がありません' : 'No conversations yet'}</p>
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
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conv.shop?.name || 'Shop'}
                          </h3>
                          {conv.unread_count && conv.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-400">
                            {new Date(conv.last_message_at).toLocaleString()}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Messages View */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {selectedConversation ? (
                <>
                  <div className="p-3 border-b border-gray-200 flex-shrink-0">
                    <h2 className="font-semibold text-gray-900 text-sm">
                      {selectedConversation.shop?.name || 'Shop'}
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {loadingMessages ? (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm">{language === 'ja' ? 'メッセージを読み込み中...' : 'Loading messages...'}</p>
                      </div>
                    ) : error ? (
                      <div className="text-center text-red-600 mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-semibold">⚠️ {language === 'ja' ? 'エラー' : 'Error'}</p>
                        <p className="text-sm mt-2">{error}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <p>{language === 'ja' ? 'メッセージがありません。会話を始めましょう！' : 'No messages yet. Start the conversation!'}</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isCustomer = message.sender_type === 'customer';
                        const messageText = message.body || message.content || '';
                        const isSending = message.status === 'sending';
                        const isFailed = message.status === 'failed';
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} min-w-0 w-full`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-md px-4 py-2 rounded-lg ${
                                isCustomer
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              } ${isFailed ? 'opacity-50 border-red-300' : ''}`}
                              style={{
                                minWidth: 0,
                                width: 'fit-content',
                                maxWidth: '85%',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {messageText ? (
                                <p className={`text-sm break-words ${isCustomer ? 'text-white' : 'text-gray-900'}`}>
                                  {messageText}
                                </p>
                              ) : (
                                <p className={`text-xs italic ${isCustomer ? 'text-blue-100' : 'text-gray-400'}`}>
                                  (Empty message)
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <p
                                  className={`text-xs ${
                                    isCustomer ? 'text-blue-100' : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(message.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {isSending && (
                                  <span className="text-xs text-blue-200 ml-2">Sending...</span>
                                )}
                                {isFailed && (
                                  <span className="text-xs text-red-300 ml-2">Failed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {/* STEP 5: Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-gray-200 p-3 flex-shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={language === 'ja' ? 'メッセージを入力...' : 'Type a message...'}
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm whitespace-nowrap"
                      >
                        {sending ? (language === 'ja' ? '送信中...' : 'Sending...') : (language === 'ja' ? '送信' : 'Send')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    {conversations.length >= 2 ? (
                      <p className="text-lg">{language === 'ja' ? '会話を選択してください' : 'Select a conversation'}</p>
                    ) : conversations.length === 1 ? (
                      <p className="text-lg">{language === 'ja' ? '読み込み中...' : 'Loading conversation...'}</p>
                    ) : (
                      <p className="text-lg">{language === 'ja' ? '会話がありません' : 'No conversations yet'}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      </>
  );
}

export default function LineInboxPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LineInboxPageContent />
    </Suspense>
  );
}

