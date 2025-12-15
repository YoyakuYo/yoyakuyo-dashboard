// Utility hook for loading and saving AI conversations using ai_conversations table
// Supports customer, owner, and guest conversations

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationIdentity {
  userType: 'customer' | 'owner' | 'guest';
  userId?: string | null; // Auth user ID for customer/owner, null for guest
  contextKey: string; // 'customer_dashboard', 'owner_dashboard', 'public_landing'
  shopId?: string | null; // Optional shop context
  guestId?: string; // For guest conversations, stored in cookie/localStorage
}

export function useAIConversation(identity: ConversationIdentity) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get or create guest ID from localStorage
  // Prefer the guestId from identity if provided, otherwise get/create from localStorage
  const getGuestId = useCallback((): string => {
    if (identity.userType !== 'guest') return '';
    
    // If guestId is provided in identity, use it (and ensure it's in localStorage)
    if (identity.guestId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('yoyakuyo_guest_id', identity.guestId);
      }
      return identity.guestId;
    }
    
    // Otherwise, get or create from localStorage
    if (typeof window === 'undefined') return '';
    
    const stored = localStorage.getItem('yoyakuyo_guest_id');
    if (stored) return stored;
    
    const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('yoyakuyo_guest_id', newGuestId);
    return newGuestId;
  }, [identity.userType, identity.guestId]);

  // Load conversation from database
  const loadConversation = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      
      // Build query based on user type
      let query = supabase
        .from('ai_conversations')
        .select('id, messages, locale')
        .eq('user_type', identity.userType)
        .eq('context_key', identity.contextKey);
      
      if (identity.userType === 'guest') {
        // For guests, filter by guest_id and context_key
        const guestId = getGuestId();
        if (guestId) {
          query = query
            .is('user_id', null)
            .eq('context_key', identity.contextKey)
            .eq('guest_id', guestId); // Filter by guest_id to isolate conversations
        } else {
          // No guest ID yet, only filter by context (will create new conversation)
          query = query.is('user_id', null).eq('context_key', identity.contextKey);
        }
      } else if (identity.userId) {
        // For customers/owners, filter by user_id and context_key
        query = query.eq('user_id', identity.userId).eq('context_key', identity.contextKey);
      }
      
      if (identity.shopId) {
        query = query.eq('shop_id', identity.shopId);
      }
      
      // Get the most recent conversation
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading conversation:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        // For guests, double-check guest_id matches (extra security check)
        if (identity.userType === 'guest' && identity.guestId) {
          const dataGuestId = (data as any).guest_id;
          if (dataGuestId && dataGuestId !== identity.guestId) {
            // This conversation belongs to a different guest, start fresh
            console.warn('Guest ID mismatch - conversation belongs to different guest');
            setConversationId(null);
            setMessages([]);
            setLoading(false);
            return;
          }
        }
        
        setConversationId(data.id);
        // Parse messages from JSONB
        const parsedMessages = Array.isArray(data.messages) 
          ? data.messages.map((msg: any) => ({
              role: msg.role || 'user',
              content: msg.content || msg.message || '',
              timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
            }))
          : [];
        
        // CRITICAL: Deduplicate messages by role + content (ignore timestamp differences)
        // This prevents duplicate assistant messages from appearing
        const seenMessages = new Map<string, number>();
        const deduplicatedMessages: any[] = [];
        
        for (const msg of parsedMessages) {
          // Create a key based on role and content (not timestamp)
          const messageKey = `${msg.role}:${msg.content}`;
          const lastSeenIndex = seenMessages.get(messageKey);
          
          // Only add if we haven't seen this exact message before, or if it's a different position
          // (allows same message in different contexts, but prevents immediate duplicates)
          if (lastSeenIndex === undefined || lastSeenIndex < deduplicatedMessages.length - 1) {
            deduplicatedMessages.push(msg);
            seenMessages.set(messageKey, deduplicatedMessages.length - 1);
          } else {
            console.log(`[AI Chat] Skipping duplicate message on load: ${messageKey.substring(0, 50)}`);
          }
        }
        
        // DEBUG ASSERTION: Check for orphaned assistant messages
        const userMessageCount = deduplicatedMessages.filter((m: any) => m.role === 'user').length;
        const assistantMessageCount = deduplicatedMessages.filter((m: any) => m.role === 'assistant').length;
        if (assistantMessageCount > userMessageCount && deduplicatedMessages.length > 0) {
          console.error(`[AI CHAT BUG DETECTED] Orphaned assistant message on load! User messages: ${userMessageCount}, Assistant messages: ${assistantMessageCount}`);
          console.error(`[AI CHAT BUG] Conversation ID: ${data.id}, Guest ID: ${identity.guestId || 'none'}, User ID: ${identity.userId || 'none'}`);
          
          // CLEANUP: Remove orphaned assistant messages (assistant messages without preceding user message)
          // This fixes existing corrupted conversations
          const cleanedMessages: any[] = [];
          for (let i = 0; i < deduplicatedMessages.length; i++) {
            const msg = deduplicatedMessages[i];
            const prevMsg = i > 0 ? deduplicatedMessages[i - 1] : null;
            
            // Keep system messages
            if (msg.role === 'system') {
              cleanedMessages.push(msg);
            }
            // Keep user messages
            else if (msg.role === 'user') {
              cleanedMessages.push(msg);
            }
            // Only keep assistant messages if the previous message is a user message
            else if (msg.role === 'assistant') {
              if (prevMsg && prevMsg.role === 'user') {
                cleanedMessages.push(msg);
              } else {
                console.warn(`[AI Chat Cleanup] Removing orphaned assistant message: ${msg.content.substring(0, 50)}...`);
              }
            }
          }
          
          // Update the conversation in database if we removed messages
          if (cleanedMessages.length < deduplicatedMessages.length) {
            console.log(`[AI Chat Cleanup] Removed ${deduplicatedMessages.length - cleanedMessages.length} orphaned messages`);
            // Save cleaned messages back to database (async, non-blocking)
            supabase
              .from('ai_conversations')
              .update({ messages: cleanedMessages })
              .eq('id', data.id)
              .then(({ error }) => {
                if (error) {
                  console.error('[AI Chat Cleanup] Error saving cleaned messages:', error);
                } else {
                  console.log('[AI Chat Cleanup] ✅ Successfully cleaned conversation');
                }
              });
          }
          
          // Use cleaned messages for display
          const displayMessages = cleanedMessages.filter((msg: any) => msg.role !== 'system');
          setMessages(displayMessages);
        } else {
          // CRITICAL: Filter out system messages from display (they're for AI context only)
          const displayMessages = deduplicatedMessages.filter((msg: any) => msg.role !== 'system');
          setMessages(displayMessages);
        }
      } else {
        // No conversation found, start fresh
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error in loadConversation:', error);
    } finally {
      setLoading(false);
    }
  }, [identity, getGuestId]);

  // Get shop context for AI prompts
  const getShopContext = useCallback(async (shopId: string | null | undefined): Promise<string | null> => {
    if (!shopId) return null;
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('shops')
        .select('id, name, address, prefecture, city, description, phone, email')
        .eq('id', shopId)
        .single();
      
      if (error || !data) return null;
      
      return `Shop Context: ${data.name} (${data.prefecture || ''} ${data.city || ''}). Address: ${data.address || 'N/A'}. Description: ${data.description || 'N/A'}. Contact: ${data.phone || data.email || 'N/A'}.`;
    } catch (error) {
      console.error('Error fetching shop context:', error);
      return null;
    }
  }, []);

  // Save conversation to database
  const saveConversation = useCallback(async (newMessages: ConversationMessage[]) => {
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      
      // Get shop context if shopId is provided
      let shopContext: string | null = null;
      if (identity.shopId) {
        shopContext = await getShopContext(identity.shopId);
      }
      
      // Prepare messages for JSONB storage
      // If shop context exists, inject it as a system message at the beginning
      const messagesToSave: any[] = [];
      
      // Add shop context as system message if available (only once, at the start)
      if (shopContext && !newMessages.some(msg => msg.content.includes('Shop Context:'))) {
        messagesToSave.push({
          role: 'system',
          content: shopContext,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Add all user/assistant messages
      newMessages.forEach(msg => {
        messagesToSave.push({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString(),
        });
      });
      
      const conversationData: any = {
        user_type: identity.userType,
        user_id: identity.userType === 'guest' ? null : identity.userId,
        context_key: identity.contextKey,
        messages: messagesToSave,
        updated_at: new Date().toISOString(),
      };
      
      // Add guest_id for guest conversations
      if (identity.userType === 'guest' && identity.guestId) {
        conversationData.guest_id = identity.guestId;
      }
      
      if (identity.shopId) {
        conversationData.shop_id = identity.shopId;
      }
      
      if (conversationId) {
        // CRITICAL: When updating, we need to merge with existing messages to avoid overwriting
        // Get current messages first
        const { data: currentConv } = await supabase
          .from('ai_conversations')
          .select('messages')
          .eq('id', conversationId)
          .single();
        
        if (currentConv && Array.isArray(currentConv.messages)) {
          // Merge: keep existing messages, add new ones that don't exist
          // Use role + content (not timestamp) to detect duplicates, as timestamps may differ
          const existingMessages = new Set(
            currentConv.messages.map((m: any) => `${m.role}:${m.content}`)
          );
          
          // Add new messages that don't already exist (by role + content)
          const newMessagesToAdd = messagesToSave.filter((msg: any) => {
            const key = `${msg.role}:${msg.content}`;
            return !existingMessages.has(key);
          });
          
          // Combine: existing + new
          conversationData.messages = [...currentConv.messages, ...newMessagesToAdd];
        }
        
        // Update existing conversation
        const { error } = await supabase
          .from('ai_conversations')
          .update(conversationData)
          .eq('id', conversationId);
        
        if (error) {
          console.error('Error updating conversation:', error);
        }
      } else {
        // Create new conversation
        conversationData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert(conversationData)
          .select('id')
          .single();
        
        if (error) {
          console.error('Error creating conversation:', error);
        } else if (data) {
          setConversationId(data.id);
          // For guest conversations, store the conversation ID with guest ID to prevent cross-guest access
          if (identity.userType === 'guest' && identity.guestId) {
            localStorage.setItem(`yoyakuyo_guest_conversation_${data.id}`, identity.guestId);
            localStorage.setItem('yoyakuyo_guest_conversation_id', data.id);
          }
        }
      }
    } catch (error) {
      console.error('Error in saveConversation:', error);
    } finally {
      setSaving(false);
    }
  }, [identity, conversationId, getShopContext]);

  // Add a message to the conversation
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    const newMessage: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    
    // CRITICAL: For user messages, save IMMEDIATELY before continuing
    // This ensures user messages are persisted before API calls
    if (role === 'user') {
      // Update UI optimistically
      setMessages(prev => {
        const updated = [...prev, newMessage];
        // Save immediately using the updated array
        saveConversation(updated).catch(err => {
          console.error('Error saving user message (non-blocking):', err);
        });
        return updated;
      });
    } else {
      // For assistant messages, update UI and save asynchronously
      setMessages(prev => {
        const updated = [...prev, newMessage];
        // Save using the updated array
        saveConversation(updated).catch(err => {
          console.error('Error saving assistant message (non-blocking):', err);
        });
        return updated;
      });
    }
  }, [saveConversation]);

  // Load conversation on mount and when identity changes
  // Use a ref to track if we've already loaded to prevent unnecessary reloads
  const hasLoadedRef = useRef(false);
  const identityRef = useRef(identity);
  
  useEffect(() => {
    // Only reload if identity actually changed (deep comparison of key fields)
    const identityChanged = 
      identityRef.current.userType !== identity.userType ||
      identityRef.current.userId !== identity.userId ||
      identityRef.current.contextKey !== identity.contextKey ||
      identityRef.current.shopId !== identity.shopId ||
      identityRef.current.guestId !== identity.guestId;
    
    if (!hasLoadedRef.current || identityChanged) {
      identityRef.current = identity;
      hasLoadedRef.current = true;
      loadConversation();
    }
  }, [identity.userType, identity.userId, identity.contextKey, identity.shopId, identity.guestId, loadConversation]);

  return {
    messages,
    conversationId,
    loading,
    saving,
    addMessage,
    setMessages, // Allow manual message updates
    saveConversation, // Expose save function
    reloadConversation: loadConversation,
  };
}

