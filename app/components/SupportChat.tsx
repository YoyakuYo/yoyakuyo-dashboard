"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabase';

interface Attachment {
  id: string;
  message_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  signed_url?: string;
  created_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_role: 'owner';
  created_at: string;
  attachments?: Attachment[];
  sender?: {
    id: string;
    full_name?: string;
    email?: string;
    role?: string;
    display_name?: string;
  };
}

interface SupportChatProps {
  shopId?: string;
  onClose?: () => void;
  isFloating?: boolean;
}

export default function SupportChat({ shopId, onClose, isFloating = false }: SupportChatProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('owner');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user's role from API
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchUserRole = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/me`, {
          headers: { 'x-user-id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserRole(data.user?.role || 'owner');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    fetchUserRole();
  }, [user?.id]);

  // Helper function to determine message label - ONLY based on sender_id comparison
  const getMessageLabel = (msg: Message): string => {
    // CRITICAL: Compare sender_id with current user id - NO role-based logic
    const isCurrentUser = String(msg.sender_id) === String(user?.id);
    const senderRole = msg.sender?.role || msg.sender_role;
    
    // DEBUG LOGGING
    console.log('[SupportChat] Message label check:', {
      currentUserId: user?.id,
      messageSenderId: msg.sender_id,
      isCurrentUser,
      senderRole,
      currentUserRole,
    });
    
    if (isCurrentUser) {
      // Current user's message
      return '👤 You (Owner)';
    } else {
      // Other person's message
      return '👤 Shop Owner';
    }
  };

  // Helper function to get sender display name
  const getSenderDisplayName = (msg: Message): string => {
    return msg.sender?.display_name || msg.sender?.full_name || msg.sender?.email || 'Unknown';
  };

  // Load or create support conversation
  useEffect(() => {
    if (!user?.id || !shopId) return;

    const loadConversation = async () => {
      setLoading(true);
      try {
        console.log('[SupportChat] Loading conversation...', { shopId, userId: user.id });
        
        // Try to find existing support conversation using new owner support endpoint
        const res = await fetch(`${apiUrl}/owner/support/conversations?page=1&limit=10`, {
          headers: { 'x-user-id': user.id },
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('[SupportChat] Conversations loaded:', data.conversations?.length || 0);
          // Find conversation for this shop
          const existingConv = data.conversations?.find((c: any) => 
            c.shop_id === shopId && c.customer_ref === user.id && c.is_support_ticket === true
          );
          
          if (existingConv) {
            console.log('[SupportChat] Found existing conversation:', existingConv.id);
            setConversationId(existingConv.id);
            await loadMessages(existingConv.id);
          } else {
            console.log('[SupportChat] No existing conversation found. Owner can type a message to start.');
            // Don't auto-create - let owner type their message first
            // The conversation will be created when they send their first message
          }
        } else {
          console.error('[SupportChat] Failed to load conversations, status:', res.status);
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[SupportChat] Error response:', errorData);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user?.id, shopId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`support-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Reload messages when new message arrives
          loadMessages(conversationId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSupportConversation = async (messageContent: string) => {
    if (!user?.id || !shopId) {
      console.error('Cannot create conversation: missing user.id or shopId', { userId: user?.id, shopId });
      return;
    }

    if (!messageContent || messageContent.trim().length === 0) {
      alert('Please enter a message before sending.');
      return;
    }

    try {
      console.log('[SupportChat] Creating support conversation with message...', { shopId, ownerId: user.id });
      
      // Use the new owner support endpoint - this creates conversation AND sends the message
      const res = await fetch(`${apiUrl}/owner/support/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          shop_id: shopId,
          content: messageContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[SupportChat] Conversation created:', data.conversation?.id);
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
          await loadMessages(data.conversation.id);
        } else {
          console.error('[SupportChat] Conversation created but no ID returned:', data);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[SupportChat] Failed to create conversation:', res.status, errorData);
        alert(`Failed to create support conversation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[SupportChat] Error creating conversation:', error);
      alert('Failed to create support conversation. Please try again.');
    }
  };

  const loadMessages = async (convId: string) => {
    if (!user?.id) return;
    
    try {
      // Use the new owner support endpoint
      const res = await fetch(`${apiUrl}/owner/support/conversations/${convId}`, {
        headers: { 'x-user-id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        console.error('[SupportChat] Failed to load messages:', res.status);
      }
    } catch (error) {
      console.error('[SupportChat] Error loading messages:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setSelectedFile(file);
  };

  const uploadFileAttachment = async (messageId: string, file: File): Promise<void> => {
    if (!user?.id) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${apiUrl}/owner/support/messages/${messageId}/attachments`, {
      method: 'POST',
      headers: {
        'x-user-id': user.id,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to upload file');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || sending || uploadingFile || !user?.id) return;

    // If no conversation exists yet, create one with this message
    if (!conversationId) {
      setSending(true);
      try {
        await createSupportConversation(input.trim() || '📎 File attachment');
        // After conversation is created, conversationId will be set and we'll send the file
        // But we need to wait for the conversation to be created first
        const newConvId = conversationId; // This will be set by createSupportConversation
        if (selectedFile && newConvId) {
          // We'll handle file upload after message is sent
        }
        setInput('');
        setSelectedFile(null);
      } catch (error) {
        console.error('[SupportChat] Error creating conversation with message:', error);
      } finally {
        setSending(false);
      }
      return;
    }

    // If conversation exists, send reply
    setSending(true);
    try {
      // Send message first
      const messageContent = input.trim() || (selectedFile ? '📎 File attachment' : '');
      const res = await fetch(`${apiUrl}/owner/support/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (res.ok) {
        const data = await res.json();
        const newMessageId = data.message?.id;

        // If file is selected, upload it after message is sent
        if (selectedFile && newMessageId) {
          setUploadingFile(true);
          try {
            await uploadFileAttachment(newMessageId, selectedFile);
          } catch (error: any) {
            console.error('[SupportChat] Error uploading file:', error);
            alert(`Message sent but file upload failed: ${error.message}`);
          } finally {
            setUploadingFile(false);
          }
        }

        setInput('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadMessages(conversationId);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[SupportChat] Failed to send message:', errorData);
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[SupportChat] Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (isFloating) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b bg-blue-600 text-white flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Support</h3>
              <p className="text-xs opacity-90">We're here to help</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-700 rounded p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <p>Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm mb-2">👋 Hello! How can we help you today?</p>
                <p className="text-xs">Send us a message and we'll get back to you soon.</p>
              </div>
            ) : (
              messages.map((msg: any) => {
                // ALIGNMENT RULE: Check if message is from owner (current user)
                // Use isOwnerMessage flag from backend, or check ownerUserId
                const isCurrentUser = msg.isOwnerMessage === true || 
                  (msg.ownerUserId && String(msg.ownerUserId) === String(user?.id)) ||
                  (msg.sender?.role === 'owner' && String(msg.sender?.id) === String(user?.id));
                
                // DEBUG LOGGING - Required output
                console.log('[SupportChat] Message render:', {
                  currentUserId: user?.id,
                  messageSenderId: msg.sender_id,
                  messageOwnerUserId: msg.ownerUserId,
                  messageIsOwner: msg.isOwnerMessage,
                  senderRole: msg.sender?.role,
                  isCurrentUser,
                  alignment: isCurrentUser ? 'RIGHT' : 'LEFT',
                });
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {isCurrentUser ? '👤 You (Owner)' : (msg.sender?.role === 'admin' ? '👤 Admin Support' : '👤 Support')}
                        </span>
                        {!isCurrentUser && msg.sender?.display_name && msg.sender.display_name !== 'Unknown' && (
                          <span className="text-xs opacity-80">
                            {msg.sender.display_name}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Display attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att: Attachment) => (
                            <a
                              key={att.id}
                              href={att.signed_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                isCurrentUser
                                  ? 'bg-blue-500 text-white hover:bg-blue-400'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span>📎</span>
                              <span className="truncate max-w-[200px]">{att.file_name}</span>
                              {att.file_size && (
                                <span className="opacity-70">
                                  ({(att.file_size / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString()}
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
            {/* Selected file preview */}
            {selectedFile && (
              <div className="mb-2 flex items-center justify-between px-2 py-1 bg-blue-50 rounded text-xs">
                <span className="truncate flex-1">📎 {selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                id="file-input"
                disabled={sending || uploadingFile}
              />
              <label
                htmlFor="file-input"
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
              >
                📎
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={sending || uploadingFile}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || sending || uploadingFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {uploadingFile ? 'Uploading...' : sending ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Full page version
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-blue-600 text-white">
        <h3 className="font-semibold">Contact Support</h3>
        <p className="text-xs opacity-90">We're here to help</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm mb-2">👋 Hello! How can we help you today?</p>
            <p className="text-xs">Send us a message and we'll get back to you soon.</p>
          </div>
        ) : (
          messages.map((msg: any) => {
            // ALIGNMENT RULE: Check if message is from owner (current user)
            // Use isOwnerMessage flag from backend, or check ownerUserId
            const isCurrentUser = msg.isOwnerMessage === true || 
              (msg.ownerUserId && String(msg.ownerUserId) === String(user?.id)) ||
              (msg.sender?.role === 'owner' && msg.ownerUserId && String(msg.ownerUserId) === String(user?.id));
            
            // DEBUG LOGGING - Required output
            console.log('[SupportChat] Message render:', {
              currentUserId: user?.id,
              messageSenderId: msg.sender_id,
              messageOwnerUserId: msg.ownerUserId,
              messageIsOwner: msg.isOwnerMessage,
              senderRole: msg.sender?.role,
              isCurrentUser,
              alignment: isCurrentUser ? 'RIGHT' : 'LEFT',
            });
            
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
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isCurrentUser ? '👤 You (Owner)' : (msg.sender?.role === 'admin' ? '👤 Admin Support' : '👤 Support')}
                    </span>
                    {!isCurrentUser && msg.sender?.display_name && (
                      <span className={`text-xs font-medium ${
                        isCurrentUser ? 'opacity-90' : 'text-gray-600'
                      }`}>
                        {msg.sender.display_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    isCurrentUser ? 'opacity-70' : 'text-gray-500'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString()}
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
        {/* Selected file preview */}
        {selectedFile && (
          <div className="mb-2 flex items-center justify-between px-2 py-1 bg-blue-50 rounded text-xs">
            <span className="truncate flex-1">📎 {selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            id="file-input-full"
            disabled={sending || uploadingFile || loading}
          />
          <label
            htmlFor="file-input-full"
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
          >
            📎
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || uploadingFile || loading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !selectedFile) || sending || uploadingFile}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {uploadingFile ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

