"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { messagingFetch } from "@/app/lib/messagingApiClient";
import { createClient } from "@supabase/supabase-js";
import { useLineAppI18n } from "../i18n";

// Supabase client will be initialized with JWT from backend
// This is set in the component after verifying LINE ID token
let supabase: ReturnType<typeof createClient> | null = null;

// LINE LIFF SDK types
declare global {
  interface Window {
    liff: any;
  }
}

interface Conversation {
  id: string;
  conversation_type?: string;
  target_type?: string;
  target_id?: string;
  shop_id?: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  };
  last_message_at?: string;
  created_at: string;
  is_support_ticket?: boolean;
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
  const { t } = useLineAppI18n();
  // VISIBLE DEBUG STATE (for phone testing - no console access)
  const [rtDebug, setRtDebug] = useState<string>("");
  const [rtStatus, setRtStatus] = useState<string>("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedShopId = searchParams.get('shop_id');
  const preselectedBookingId = searchParams.get('booking_id');
  const preselectedLineUserId = searchParams.get('line_user_id');
  
  const [lineUserId, setLineUserId] = useState<string>("");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [supabaseJWT, setSupabaseJWT] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null);
  
  // Helper function to initialize Supabase client (with or without JWT)
  const initializeSupabaseClient = async (jwt: string | null) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[LINE Inbox] ❌ Missing Supabase env vars");
      setRtDebug(`❌ Missing Supabase config`);
      return;
    }

    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        ...(jwt ? {
          global: {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          },
        } : {}),
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      // Set session if JWT is provided
      if (jwt) {
        try {
          const { data: sessionData, error: sessionError } = await client.auth.setSession({
            access_token: jwt,
            refresh_token: '', // Not needed for LINE users
          });
          
          if (sessionError) {
            console.error("[LINE Inbox] Error setting session:", sessionError);
          } else if (sessionData?.session) {
            console.log("[LINE Inbox] ✅ Supabase client initialized with JWT and session set");
          } else {
            console.warn("[LINE Inbox] ⚠️ Session not set, but client initialized");
          }
        } catch (sessionErr: any) {
          console.error("[LINE Inbox] Error in setSession:", sessionErr);
        }
      } else {
        console.log("[LINE Inbox] ⚠️ Supabase client initialized with anon key (no JWT)");
      }

      setSupabaseClient(client as any);
      supabase = client as any; // Update module-level variable
    } catch (error: any) {
      console.error("[LINE Inbox] Error initializing Supabase client:", error);
      setRtDebug(`❌ Failed to initialize Supabase`);
    }
  };
  
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
        
        // STEP 2: Get Supabase JWT from backend verify endpoint
        let jwt: string | null = null;
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const verifyResponse = await fetch(`${apiUrl}/api/line/liff/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: token }),
          });
          
          if (verifyResponse.ok) {
            const userData = await verifyResponse.json();
            jwt = userData.supabase_jwt || null;
            console.log("[LINE Inbox] ✅ Got Supabase JWT:", !!jwt);
            setSupabaseJWT(jwt);
            
            // STEP 3: Initialize Supabase client with JWT (or anon key as fallback)
            await initializeSupabaseClient(jwt);
          } else {
            console.warn("[LINE Inbox] ⚠️ Failed to get Supabase JWT, initializing with anon key");
            // Fallback: Initialize with anon key
            await initializeSupabaseClient(null);
          }
        } catch (jwtError: any) {
          console.error("[LINE Inbox] Error getting Supabase JWT:", jwtError);
          // Fallback: Initialize with anon key
          await initializeSupabaseClient(null);
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
      // Load ONLY booking_owner conversations for the inbox
      console.log('[LINE Inbox] API URL debug:', {
        apiUrl,
        typeofApiUrl: typeof apiUrl,
        apiUrlValue: apiUrl,
        isUndefined: apiUrl === undefined,
        isNull: apiUrl === null,
        isEmptyString: apiUrl === '',
      });
      const inboxUrl = `${apiUrl}/api/internal-messaging/conversations?conversation_type=booking_owner`;
      console.log('[LINE Inbox] Constructed inbox URL:', inboxUrl);
      console.log('[LINE Inbox] About to call conversations API:', {
        apiUrl,
        inboxUrl,
        lineUserId: lineUserId ? 'present' : 'missing',
        idToken: idToken ? 'present' : 'missing',
        envApiUrl: process.env.NEXT_PUBLIC_API_URL,
        apiUrlType: typeof apiUrl,
        apiUrlValue: apiUrl
      });

      // Check if apiUrl is just a path (starts with /)
      if (apiUrl && apiUrl.startsWith('/')) {
        console.warn('[LINE Inbox] apiUrl starts with / - this might be the issue!', { apiUrl });
      }

      const res = await messagingFetch(
        inboxUrl,
        {
          lineUserId,
          idToken: token,
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to load conversations' }));

        let errorMessage = 'Failed to load conversations. Please try again.';
        if (res.status === 401) {
          errorMessage = 'Authentication error. Please close and reopen the app.';
        } else if (res.status === 403) {
          errorMessage = 'You do not have permission to view conversations.';
        }

        console.error('[LINE Inbox] Conversation loading failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });

        alert(errorMessage);
        setLoading(false); // Stop loading state
        setError(errorMessage);
        return; // Don't throw - prevent infinite loading
      }

      const data = await res.json();
      console.log('[LINE Inbox] Loaded conversations:', data.conversations?.length || 0);
      console.log('[LINE Inbox] Sample conversation:', data.conversations?.[0]);

      // DEBUG: Check conversation types
      const conversationTypes = data.conversations?.map((c: any) => c.conversation_type) || [];
      console.log('[LINE Inbox] Conversation types:', [...new Set(conversationTypes)]);
      console.log("[LINE Inbox] Loaded conversations:", data.conversations?.length || 0);
      
      // CRITICAL: Deduplicate by target_id - keep only the latest conversation per target
      const rawConversations: Conversation[] = data.conversations || [];
      const byTarget = new Map<string, Conversation>();
      for (const conv of rawConversations) {
        const key = conv.target_id || conv.shop_id || conv.id;
        const existing = byTarget.get(key);
        if (!existing) {
          byTarget.set(key, conv);
        } else {
          // Keep the one with latest last_message_at (or created_at if no messages)
          const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
          const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
          if (newTime > existingTime) {
            byTarget.set(key, conv);
          }
        }
      }
      const deduped = Array.from(byTarget.values()).sort((a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      );
      console.log("[LINE Inbox] Deduplicated conversations:", deduped.length, "from", rawConversations.length);
      setConversations(deduped);

      // Auto-select the most recent conversation for better UX
      if (deduped.length > 0 && !selectedConversation) {
        console.log("[LINE Inbox] Auto-selecting most recent conversation:", deduped[0].id);
        handleSelectConversation(deduped[0]);
      }
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
            const byTarget = new Map<string, Conversation>();
            for (const conv of allConversations) {
              const key = conv.target_id || conv.shop_id || conv.id;
              const existing = byTarget.get(key);
              if (!existing) {
                byTarget.set(key, conv);
              } else {
                const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
                const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
                if (newTime > existingTime) {
                  byTarget.set(key, conv);
                }
              }
            }
            const deduped = Array.from(byTarget.values()).sort((a, b) =>
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
        } else {
          // Show alert for other errors since user can't see console on mobile
          alert('Failed to load messages. Please check your connection and try again.');
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
      
      // Auto-scroll will happen automatically via useEffect when messages.length changes
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

        console.log('[LINE Inbox] sendMessage - Shop determination:', {
          preselectedShopId,
          conversationsCount: conversations.length,
          firstConversationShopId: conversations.length > 0 ? conversations[0].shop_id : null,
          determinedShopId: shopId
        });

        if (!shopId) {
          setError('Cannot send message: No shop selected and no conversation exists.');
          return;
        }

      // FIRST: Check if conversation already exists in list (by target_id for shop conversations)
      let existingConv = conversations.find(c => c.target_id === shopId && c.conversation_type === 'booking_owner');

      console.log('[LINE Inbox] sendMessage - Existing conversation check:', {
        shopId,
        conversationType: 'booking_owner',
        foundInList: !!existingConv,
        existingConvId: existingConv?.id,
        conversationsCount: conversations.length,
        conversationsList: conversations.map(c => ({ id: c.id, target_id: c.target_id, type: c.conversation_type, shop_id: c.shop_id }))
      });
      
      // SECOND: If not in list, check backend (conversation might exist but not be loaded)
      if (!existingConv) {
        console.log("[LINE Inbox] Not in list, checking backend for existing conversation...");
        try {
          const res = await messagingFetch(
            `${apiUrl}/api/internal-messaging/conversations?conversation_type=booking_owner`,
            {
              lineUserId,
              idToken,
            }
          );
          
          if (res.ok) {
            const data = await res.json();
            const allConversations: Conversation[] = data.conversations || [];
            existingConv = allConversations.find(c => c.target_id === shopId && c.conversation_type === 'booking_owner');

            console.log('[LINE Inbox] Backend conversation search:', {
              allConversationsCount: allConversations.length,
              foundInBackend: !!existingConv,
              backendConvId: existingConv?.id,
              allConversations: allConversations.map(c => ({ id: c.id, target_id: c.target_id, type: c.conversation_type, shop_id: c.shop_id }))
            });

            if (existingConv) {
              // Update conversations list with backend data (deduplicated)
              const byTarget = new Map<string, Conversation>();
              for (const conv of allConversations) {
                const key = conv.target_id || conv.shop_id || conv.id;
                const existing = byTarget.get(key);
                if (!existing) {
                  byTarget.set(key, conv);
                } else {
                  const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
                  const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
                  if (newTime > existingTime) {
                    byTarget.set(key, conv);
                  }
                }
              }
              const deduped = Array.from(byTarget.values()).sort((a, b) =>
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
        console.log('[LINE Inbox] Creating new conversation with params:', {
          shop_id: shopId,
          booking_id: preselectedBookingId,
          customer_type: 'line',
          customer_ref: lineUserId
        });
        
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
                conversation_type: 'booking_owner',
                target_type: 'shop',
                target_id: shopId,
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
            // CRITICAL: Deduplicate by target_id - only one conversation per target
            const byTarget = new Map<string, Conversation>();
            // Add existing conversations
            for (const conv of prev) {
              const key = conv.target_id || conv.shop_id || conv.id;
              const existing = byTarget.get(key);
              if (!existing) {
                byTarget.set(key, conv);
              } else {
                // Keep the one with latest last_message_at
                const existingTime = new Date(existing.last_message_at || existing.created_at).getTime();
                const newTime = new Date(conv.last_message_at || conv.created_at).getTime();
                if (newTime > existingTime) {
                  byTarget.set(key, conv);
                }
              }
            }
            // Add new conversation (will replace if target_id exists)
            const newKey = conversationToUse!.target_id || conversationToUse!.shop_id || conversationToUse!.id;
            byTarget.set(newKey, conversationToUse!);

            const deduped = Array.from(byTarget.values()).sort((a, b) =>
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
    console.log('[LINE Inbox] Realtime subscription check:', {
      conversationId,
      hasRealtimeChannel: !!realtimeChannelRef.current,
      realtimeChannelState: realtimeChannelRef.current?.state
    });

    if (conversationId && !realtimeChannelRef.current) {
      console.log("[LINE Inbox] Realtime subscription missing, setting up now:", conversationId);
      subscribeToMessages(conversationId);
    }

    // STEP 1: VERIFY THE ACTUAL BUG - Log conversation_id BEFORE send
    const conversationIdBeforeSend = conversationId;
    const lockedIdBeforeSend = lockedConversationIdRef.current;
    const channelState = realtimeChannelRef.current?.state || 'NONE';
    console.log("[LINE Inbox] [BUG CHECK] conversation_id BEFORE send:", conversationIdBeforeSend);
    console.log("[LINE Inbox] [BUG CHECK] lockedConversationIdRef BEFORE send:", lockedIdBeforeSend);
    console.log("[LINE Inbox] [BUG CHECK] selectedConversation.id BEFORE send:", conversationToUse?.id);
    console.log("[LINE Inbox] [BUG CHECK] messages.length BEFORE send:", messages.length);
    console.log("[LINE Inbox] [BUG CHECK] last message ID BEFORE send:", messages[messages.length - 1]?.id);
    console.log("[LINE Inbox] [SUBSCRIPTION] Realtime channel exists:", !!realtimeChannelRef.current);
    console.log("[LINE Inbox] [SUBSCRIPTION] Realtime channel state:", channelState);

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
    
    // Auto-scroll will happen automatically via useEffect when messages.length changes

    try {
      setSending(true);
      console.log("[LINE Inbox] Sending message to conversation:", conversationId, {
        contentLength: trimmedContent.length,
        tempId,
      });
      
      // ALWAYS inject X-User-Id via unified messaging API client
      // Add timeout to prevent hanging on mobile networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        alert('Request timed out. Please check your connection and try again.');
      }, 15000); // 15 second timeout for mobile

      let res: Response;
      try {
        res = await messagingFetch(
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
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));

        // Show user-visible error message for mobile LINE users
        let errorMessage = 'Failed to send message. Please try again.';
        if (res.status === 401) {
          errorMessage = 'Authentication error. Please close and reopen the app.';
        } else if (res.status === 403) {
          errorMessage = 'You do not have permission to send messages.';
        } else if (res.status === 404) {
          errorMessage = 'Conversation not found. Please refresh.';
        } else if (res.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        console.error('[LINE Inbox] Message sending failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
          conversationId,
          contentLength: trimmedContent.length
        });

        alert(errorMessage);
        throw new Error(errorData.error || `Failed to send message (${res.status})`);
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
      // Auto-scroll will happen automatically via useEffect when messages.length changes

      // CRITICAL: Rely ONLY on Supabase realtime for AI responses
      // No fallback - if realtime doesn't work, we need to fix the configuration
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
  // CRITICAL: Don't use useCallback - it causes stale closures and dependency issues
  const subscribeToMessages = (conversationId: string) => {
    // Use component state client if available, otherwise module-level
    const client = supabaseClient || supabase;
    
    if (!client) {
      console.warn("[LINE Inbox] Supabase client not initialized, skipping realtime");
      setRtDebug(`❌ Supabase client not initialized`);
      setRtStatus(`Missing Supabase config`);
      return;
    }
    
    // STEP 5: Check auth session before subscribing (non-blocking)
    // CRITICAL: Realtime works better with authenticated session, but we can try with anon too
    client.auth.getSession().then(({ data: { session }, error: sessionError }: any) => {
      if (sessionError) {
        console.warn("[LINE Inbox] ⚠️ Session check error (non-fatal):", sessionError);
      }
      
      if (session) {
        console.log("[LINE Inbox] ✅ Auth session exists, proceeding with realtime");
        setRtDebug(`✅ Auth session active`);
      } else {
        console.warn("[LINE Inbox] ⚠️ No auth session, will try with anon key (RLS may block)");
        setRtDebug(`⚠️ No auth session - using anon`);
      }
      
      // Continue with subscription setup regardless of session status
      // RLS policies allow anon fallback, so we can still try
      setupSubscription(client, conversationId);
    }).catch((error: any) => {
      console.error("[LINE Inbox] Error checking auth session:", error);
      setRtDebug(`⚠️ Auth check failed - trying anyway`);
      // Try to subscribe anyway - anon might work
      setupSubscription(client, conversationId);
    });
  };
  
  // Helper function to set up the actual subscription (after auth is confirmed)
  const setupSubscription = (client: ReturnType<typeof createClient>, conversationId: string) => {
    // Verify Supabase env vars are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error("[RT] Supabase env vars missing!");
      setRtDebug(`❌ Missing env vars: URL=${!!supabaseUrl}, Key=${!!supabaseKey}`);
      setRtStatus(`Config error`);
      return;
    }

    // CRITICAL: Always use locked conversation_id, not the parameter
    const lockedId = lockedConversationIdRef.current || conversationId;
    if (!lockedId) {
      console.warn("[LINE Inbox] No conversation ID to subscribe to");
      return;
    }

    // STEP 4: ENSURE CLEAN UNSUBSCRIBE
    // On conversation change: unsubscribe old channel THEN create new one
    const currentChannel = realtimeChannelRef.current;
    if (currentChannel) {
      const currentState = currentChannel.state;
      const currentLockedId = lockedConversationIdRef.current;
      console.log("[RT] Existing channel state:", currentState, "for conversation:", currentLockedId);
      
      // Always unsubscribe if switching conversations or channel is in error state
      // NOTE: Don't unsubscribe on CLOSED if it's the same conversation - let reconnection handle it
      if (currentLockedId !== lockedId || currentState === 'CHANNEL_ERROR') {
        console.log("[RT] UNSUBSCRIBING old channel (switching conversation or error)", currentLockedId);
        setRtDebug(`🔌 Unsubscribing from ${currentLockedId?.substring(0, 8)}`);
        // CRITICAL: Unsubscribe before creating new subscription
        client.removeChannel(currentChannel);
        realtimeChannelRef.current = null; // Clear ref immediately
      } else if (currentState === 'CLOSED' && currentLockedId === lockedId) {
        // Channel closed for same conversation - clear ref and reconnect
        console.log("[RT] Channel closed for same conversation, will reconnect");
        setRtDebug(`🔌 Channel closed, reconnecting...`);
        realtimeChannelRef.current = null; // Clear ref so we can create new subscription
        // Don't return - continue to create new subscription
      } else if (currentState === 'SUBSCRIBED' && currentLockedId === lockedId) {
        console.log("[RT] Channel already subscribed for this conversation, skipping");
        setRtDebug(`✅ Already subscribed to ${lockedId.substring(0, 8)}`);
        return; // Already subscribed to same conversation, don't re-subscribe
      }
    }

    // STEP 1: HARD DIAGNOSTIC LOGGING
    console.log("[RT] SUBSCRIBING", lockedId);
    console.log("[RT] LISTENING TO", lockedId);
    console.log("[RT] Channel name will be:", `messages-realtime-${lockedId}`);
    setRtDebug(`📡 Subscribing to ${lockedId.substring(0, 8)}...`);
    setRtStatus("⏳ Connecting...");
    
    // STEP 2: SINGLE CANONICAL REALTIME SUBSCRIPTION
    // REQUIRED: channel name format: messages-realtime-${conversationId}
    const channelName = `messages-realtime-${lockedId}`;
    
    // STEP 3: VERIFY FILTER - conversation_id must be UUID type matching lockedId
    // Ensure lockedId is a valid UUID string (not null/undefined)
    if (!lockedId || typeof lockedId !== 'string' || lockedId.length !== 36) {
      console.error("[RT] Invalid conversation_id format:", lockedId);
      setRtDebug(`❌ Invalid conversation_id format`);
      return;
    }
    const filterString = `conversation_id=eq.${lockedId}`;
    console.log("[RT] Filter:", filterString);
    console.log("[RT] lockedId type:", typeof lockedId, "value:", lockedId, "length:", lockedId.length);
    
    // CRITICAL: Use new Supabase Realtime API - postgres_changes with proper filter
    // Add channel config to prevent premature closure
    const channel = client
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: filterString,
        },
        async (payload: any) => {
          // STEP 6: DEBUG CONFIRMATION
          console.log("[RT] Realtime payload received");
          console.log("[RT] payload.id:", payload.new.id);
          console.log("[RT] payload.conversation_id:", payload.new.conversation_id);
          console.log("[RT] payload.sender_type:", payload.new.sender_type);
          console.log("[RT] payload.sender_id:", payload.new.sender_id);
          setRtDebug(`📨 INSERT: ${payload.new.id?.substring(0, 8)}`);
          
          const newMessage = payload.new as any;
          
          // STEP 3: VERIFY FILTER COLUMN - double-check conversation_id matches
          if (newMessage.conversation_id !== lockedId) {
            console.warn("[RT] Filter mismatch (should not happen):", {
              listeningTo: lockedId,
              messageFor: newMessage.conversation_id,
            });
            setRtDebug(`⚠️ Filter mismatch`);
            return;
          }
          
          // CRITICAL: Determine sender_type by fetching participant info
          // Realtime payload doesn't include participant join, so we need to fetch it
          let senderType: 'customer' | 'shop' = 'shop'; // Default to shop (AI/owner messages)
          
          const client = supabaseClient || supabase;
          if (client && newMessage.sender_id) {
            try {
              // Fetch participant to get source
              const { data: participant, error: partError } = await client
                .from('participants')
                .select('source')
                .eq('id', newMessage.sender_id)
                .single();
              
              if (!partError && participant && (participant as any).source) {
                const source = (participant as any).source;
                // Map participant source to sender_type
                if (source === 'customer' || source === 'line' || source === 'web' || source === 'guest') {
                  senderType = 'customer';
                } else {
                  // 'ai' or 'owner' → shop
                  senderType = 'shop';
                }
                console.log("[RT] Determined sender_type from participant:", senderType, "source:", source);
              } else {
                console.warn("[RT] Could not fetch participant or missing source, defaulting to 'shop'");
              }
            } catch (fetchError: any) {
              console.error("[RT] Error fetching participant:", fetchError);
              // Default to 'shop' on error
            }
          } else if (newMessage.sender_type) {
            // Fallback: Use explicit sender_type if provided
            senderType = newMessage.sender_type === 'customer' ? 'customer' : 'shop';
            console.log("[RT] Using explicit sender_type from payload:", senderType);
          } else {
            // Last resort: Default to 'shop' (AI/owner response)
            // Customer messages are added optimistically, so new realtime messages are likely shop/AI
            console.warn("[RT] No sender_id or sender_type, defaulting to 'shop'");
          }
          
          // STEP 2: STATE UPDATE - MUST USE FUNCTIONAL UPDATE
          setMessages((prev) => {
            console.log("[RT] CURRENT messages.length BEFORE", prev.length);
            console.log("[RT] APPENDING MESSAGE", newMessage.id, "sender_type:", senderType);
            setRtDebug(`📝 Appending msg ${newMessage.id?.substring(0, 8)} (was ${prev.length} msgs)`);
            
            // Check if message already exists (avoid duplicates)
            // This is normal - messages loaded via API might also come through realtime
            if (prev.some((msg) => msg.id === newMessage.id)) {
              console.log("[RT] MESSAGE ALREADY EXISTS, SKIPPING", newMessage.id);
              // Don't show duplicate warning - it's normal behavior
              return prev;
            }
            
            const formattedMessage: Message = {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              sender_type: senderType,
              body: newMessage.body || newMessage.content,
              content: newMessage.content || newMessage.body,
              created_at: newMessage.created_at,
              status: 'sent',
            };
            
            // Return new array - React will detect this change and trigger useEffect for auto-scroll
            const updated = [...prev, formattedMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            console.log("[RT] NEW messages.length AFTER", updated.length);
            setRtDebug(`✅ Added! Now ${updated.length} msgs`);
            // Clear debug after 3 seconds (will show render state)
            setTimeout(() => setRtDebug(`[RENDER] ${updated.length} msgs`), 3000);
            return updated;
          });
        }
      )
      .subscribe((status: any, err: any) => {
        // STEP 6: DEBUG CONFIRMATION
        console.log("[RT] Subscribed to channel", channelName);
        console.log("[RT] STATUS", status, err);
        setRtStatus(`Status: ${status}${err ? ` - ${err.message || JSON.stringify(err)}` : ''}`);
        if (status === 'SUBSCRIBED') {
          console.log("[RT] ✅ Successfully subscribed to channel:", channelName);
          setRtDebug(`✅ Subscribed to ${lockedId.substring(0, 8)}`);
          setRtStatus(`✅ Connected`); // Clear "Connecting..." status
        } else if (status === 'CHANNEL_ERROR') {
          const errorMsg = err?.message || err?.toString() || 'Unknown error';
          console.error("[RT] CHANNEL ERROR DETAILS:", err);
          setRtDebug(`❌ Channel ERROR`);
          setRtStatus(`Error: ${errorMsg.substring(0, 60)}`);
          // Common causes:
          // 1. REPLICA IDENTITY not FULL - run migration 20250301_enable_realtime_replica_identity.sql
          // 2. Table not in supabase_realtime publication
          // 3. RLS blocking realtime SELECT
          // 4. Filter binding mismatch - check conversation_id type
        } else if (status === 'TIMED_OUT') {
          setRtDebug(`⏱️ Timeout - reconnecting...`);
          setRtStatus(`Timeout - reconnecting...`);
          // Auto-reconnect on timeout
          setTimeout(() => {
            if (lockedId && lockedConversationIdRef.current === lockedId) {
              console.log("[RT] Reconnecting after timeout...");
              subscribeToMessages(lockedId);
            }
          }, 2000);
        } else if (status === 'CLOSED') {
          console.warn("[RT] Channel CLOSED - attempting reconnection");
          setRtDebug(`🔌 Channel CLOSED - reconnecting...`);
          setRtStatus(`Closed - reconnecting...`);
          // CRITICAL: Auto-reconnect if channel closes unexpectedly
          // Only reconnect if we're still on the same conversation
          if (lockedId && lockedConversationIdRef.current === lockedId) {
            console.log("[RT] Attempting to reconnect to:", lockedId);
            // Clear the ref so we can create a new subscription
            realtimeChannelRef.current = null;
            // Reconnect after a short delay
            setTimeout(() => {
              if (lockedConversationIdRef.current === lockedId) {
                console.log("[RT] Reconnecting now...");
                subscribeToMessages(lockedId);
              }
            }, 1000);
          }
        } else {
          setRtDebug(`⏳ ${status}`);
        }
      });
    
    realtimeChannelRef.current = channel;
    console.log("[RT] Channel created and subscribing:", channelName);
  };
  
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
  
  // STEP 4: ENSURE CLEAN UNSUBSCRIBE - On component unmount
  useEffect(() => {
    return () => {
      const client = supabaseClient || supabase;
      if (realtimeChannelRef.current && client) {
        const conversationId = lockedConversationIdRef.current;
        console.log("[RT] UNSUBSCRIBED (component unmount)", conversationId);
        setRtDebug(`🔌 Unsubscribed (unmount) ${conversationId?.substring(0, 8)}`);
        // CRITICAL: 반드시 unsubscribe on unmount
        client.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, []);
  
  // CRITICAL: Auto-open conversation if there's exactly one and no preselected shop
  useEffect(() => {
    // Only auto-open if: exactly 1 conversation, no conversation selected, no preselected shop, and we have auth
    if (conversations.length === 1 && !selectedConversation && !preselectedShopId && lineUserId && idToken && !loading) {
      const singleConv = conversations[0];
      console.log("[LINE Inbox] Auto-opening single conversation:", singleConv.id);
      handleSelectConversation(singleConv);
    }
  }, [conversations.length, selectedConversation, preselectedShopId, lineUserId, idToken, loading]);

  // STEP 5: Subscribe to realtime when conversation is selected
  // CRITICAL: Only subscribe when conversation actually changes, don't clean up unnecessarily
  useEffect(() => {
    if (selectedConversation && lineUserId && idToken) {
      // STEP 3: Use locked conversation ID, never recalculate
      const conversationId = lockedConversationIdRef.current || selectedConversation.id;
      if (conversationId) {
        // Only subscribe if we don't already have an active subscription for this conversation
        const currentChannel = realtimeChannelRef.current;
        const channelState = currentChannel?.state;
        if (!currentChannel || channelState !== 'SUBSCRIBED' || lockedConversationIdRef.current !== conversationId) {
          console.log("[LINE Inbox] Setting up subscription for conversation:", conversationId);
          subscribeToMessages(conversationId);
        } else {
          console.log("[LINE Inbox] Subscription already active for conversation:", conversationId);
        }
      }
    }
    
    // CRITICAL: Only clean up on unmount or when conversation actually changes
    // Don't clean up on every render
    return () => {
      // Only clean up if component is unmounting (not on dependency changes)
      // The subscribeToMessages function already handles cleanup when setting up new subscriptions
    };
  }, [selectedConversation?.id, lineUserId, idToken]);
  
  // CRITICAL: Auto-scroll to bottom when messages change (realtime or user send)
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

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

  // STEP 3: VERIFY RENDER IS ACTUALLY TRIGGERED
  console.log("[RENDER] messages.length", messages.length);
  console.log("[RENDER] selectedConversation.id", selectedConversation?.id);
  console.log("[RENDER] lockedConversationIdRef", lockedConversationIdRef.current);
  
  // Update visible debug with render info
  const renderDebug = `[RENDER] ${messages.length} msgs | Conv: ${selectedConversation?.id?.substring(0, 8) || 'none'}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' }}>


        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">{t("inboxTitleShort")}</h1>
              <button
                onClick={() => router.push("/line-app")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t("back")}
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
                    {t("selectConversation")}
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
                        <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                            {conv.shop?.name || (conv.is_support_ticket ? t("admin.support") || "Support" : 'Shop')}
                        </h3>
                          {conv.is_support_ticket && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {t("admin.support") || "Support"}
                            </span>
                          )}
                        </div>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.last_message_at && (() => {
                        const date = new Date(conv.last_message_at);
                        return !isNaN(date.getTime()) ? (
                          <p className="text-xs text-gray-400">
                            {date.toLocaleString()}
                          </p>
                        ) : null;
                      })()}
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
                  <h2 className="font-semibold text-gray-900 text-sm">{t("conversationsTitle")}</h2>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">{t("noConversationsYet")}</p>
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
                            {(() => {
                              const date = new Date(conv.last_message_at);
                              return !isNaN(date.getTime()) ? date.toLocaleString() : '';
                            })()}
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
              {selectedConversation || conversations.length === 0 ? (
                <>
                  <div className="p-3 border-b border-gray-200 flex-shrink-0">
                    <h2 className="font-semibold text-gray-900 text-sm">
                      {selectedConversation ? (selectedConversation.shop?.name || 'Shop') : t("messagesTitle") || 'Messages'}
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {loadingMessages ? (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm">{t("loadingMessages")}</p>
                      </div>
                    ) : error ? (
                      <div className="text-center text-red-600 mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-semibold">⚠️ {t("error")}</p>
                        <p className="text-sm mt-2">{error}</p>
                      </div>
                    ) : !selectedConversation && conversations.length > 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <p className="text-lg mb-2">{t("selectConversation") || "Select a conversation from the list to start messaging"}</p>
                        {conversations.length === 1 && (
                          <button
                            onClick={() => handleSelectConversation(conversations[0])}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            {t("openConversation") || "Open Conversation"}
                          </button>
                        )}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <p>{t("noMessagesYet")}</p>
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

                  {/* Input Area - Show when conversation is selected */}
                  {selectedConversation && (
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
                          placeholder={t("typeMessage")}
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                          disabled={sending}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={sending || !newMessage.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm whitespace-nowrap"
                        >
                        {sending ? t("sending") : t("send")}
                      </button>
                    </div>
                  </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    {conversations.length >= 2 ? (
                      <p className="text-lg">{t("selectConversation")}</p>
                    ) : conversations.length === 1 ? (
                      <p className="text-lg">{t("loading")}</p>
                    ) : (
                      <p className="text-lg">{t("noConversationsYet")}</p>
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

