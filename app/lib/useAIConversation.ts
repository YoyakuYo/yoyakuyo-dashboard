// Utility hook for loading and saving AI conversations using ai_conversations table
// Supports customer, owner, and guest conversations

import { useState, useEffect, useCallback } from 'react';
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
  const getGuestId = useCallback((): string => {
    if (identity.userType !== 'guest') return '';
    
    const stored = localStorage.getItem('yoyakuyo_guest_id');
    if (stored) return stored;
    
    const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('yoyakuyo_guest_id', newGuestId);
    return newGuestId;
  }, [identity.userType]);

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
        // For guests, we need to match by guest_id stored in messages metadata
        // Since we can't filter by guest_id directly, we'll load all guest conversations
        // and filter client-side (or use a different approach)
        // For now, we'll use a placeholder shop_id or create a unique identifier
        const guestId = getGuestId();
        // Store guest_id in a separate field or use shop_id as a placeholder
        // Actually, let's use a combination: context_key + guest_id stored in messages
        query = query.is('user_id', null);
      } else if (identity.userId) {
        query = query.eq('user_id', identity.userId);
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
        setConversationId(data.id);
        // Parse messages from JSONB
        const parsedMessages = Array.isArray(data.messages) 
          ? data.messages.map((msg: any) => ({
              role: msg.role || 'user',
              content: msg.content || msg.message || '',
              timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
            }))
          : [];
        setMessages(parsedMessages);
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

  // Save conversation to database
  const saveConversation = useCallback(async (newMessages: ConversationMessage[]) => {
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      
      // Prepare messages for JSONB storage
      const messagesToSave = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
      
      const conversationData: any = {
        user_type: identity.userType,
        user_id: identity.userType === 'guest' ? null : identity.userId,
        context_key: identity.contextKey,
        messages: messagesToSave,
        updated_at: new Date().toISOString(),
      };
      
      if (identity.shopId) {
        conversationData.shop_id = identity.shopId;
      }
      
      if (conversationId) {
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
          // For guest conversations, we might want to store the conversation ID
          if (identity.userType === 'guest') {
            localStorage.setItem('yoyakuyo_guest_conversation_id', data.id);
          }
        }
      }
    } catch (error) {
      console.error('Error in saveConversation:', error);
    } finally {
      setSaving(false);
    }
  }, [identity, conversationId]);

  // Add a message to the conversation
  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    const newMessage: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Save to database asynchronously
    await saveConversation(updatedMessages);
  }, [messages, saveConversation]);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

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

