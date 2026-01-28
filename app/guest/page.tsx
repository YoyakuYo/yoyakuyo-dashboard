"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { messagingFetch } from "@/app/lib/messagingApiClient";
import { GUEST_ID_STORAGE_KEY, setGuestId as persistGuestId } from "@/lib/guestId";

type Conversation = {
  id: string;
  shop_id: string;
  shop?: { id: string; name: string; address?: string };
  last_message_at?: string | null;
  created_at?: string;
  unread_count?: number;
};

type Message = {
  id: string;
  conversation_id: string;
  content?: string | null;
  body?: string | null;
  created_at: string;
  sender_type?: string;
  sender_role?: string;
  participant_source?: string;
};

function GuestInboxContent() {
  const searchParams = useSearchParams();
  const [guestIdInput, setGuestIdInput] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-load guest ID from URL query params or localStorage
  useEffect(() => {
    // Priority: URL param > localStorage
    const urlGuestId = searchParams?.get("guestId");
    const savedGuestId = localStorage.getItem(GUEST_ID_STORAGE_KEY) || localStorage.getItem("guest_id");
    
    const idToUse = urlGuestId?.trim() || savedGuestId?.trim();
    
    if (idToUse) {
      console.log('[Guest Inbox] Auto-loading guestId:', idToUse.substring(0, 10) + '...');
      setGuestIdInput(idToUse);
      setGuestId(idToUse);
      persistGuestId(idToUse); // Save to localStorage
    }
    setInitialized(true);
  }, [searchParams]);

  // Auto-fetch conversations when guestId is set
  useEffect(() => {
    if (initialized && guestId) {
      loadConversations(guestId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, guestId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Guest Inbox] Loading conversations for guestId:', id.substring(0, 10) + '...');
      const res = await messagingFetch(`${apiUrl}/api/internal-messaging/conversations`, {
        bookingToken: id,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed to load conversations" }));
        throw new Error(e.error || "Failed to load conversations");
      }
      const data = await res.json();
      console.log('[Guest Inbox] Loaded conversations:', data.conversations?.length || 0);
      setConversations(data.conversations || []);
      const first = (data.conversations || [])[0];
      if (first?.id) {
        setSelectedConversationId(first.id);
      }
    } catch (e: any) {
      console.error('[Guest Inbox] Error loading conversations:', e);
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    if (!guestId) return;
    setLoading(true);
    setError(null);
    try {
      console.log('[Guest Inbox] Loading messages for conversation:', convId);
      const res = await messagingFetch(`${apiUrl}/api/internal-messaging/${convId}/messages`, {
        bookingToken: guestId,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed to load messages" }));
        throw new Error(e.error || "Failed to load messages");
      }
      const data = await res.json();
      console.log('[Guest Inbox] Loaded messages:', data.messages?.length || 0);
      setMessages(data.messages || []);
    } catch (e: any) {
      console.error('[Guest Inbox] Error loading messages:', e);
      setError(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConversationId && guestId) {
      loadMessages(selectedConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, guestId]);

  const onUseGuestId = async () => {
    const id = guestIdInput.trim();
    if (!id) return;
    // Persist the guest ID
    persistGuestId(id);
    setGuestId(id);
    await loadConversations(id);
  };

  const onSend = async () => {
    if (!guestId || !selectedConversationId) return;
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      console.log('[Guest Inbox] Sending message...');
      const res = await messagingFetch(`${apiUrl}/api/internal-messaging/messages`, {
        bookingToken: guestId,
        method: "POST",
        body: { conversation_id: selectedConversationId, content },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed to send message" }));
        throw new Error(e.error || "Failed to send message");
      }
      console.log('[Guest Inbox] Message sent successfully');
      await loadMessages(selectedConversationId);
    } catch (e: any) {
      console.error('[Guest Inbox] Error sending message:', e);
      setError(e?.message || "Failed to send");
    }
  };

  // Determine if a message is from the guest or from shop/admin
  const isFromGuest = (msg: Message) => {
    // Guest messages have participant_source === 'guest' or sender_role === 'customer'
    return msg.participant_source === 'guest' || 
           msg.sender_type === 'customer' || 
           msg.sender_role === 'customer';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <p className="text-gray-600 mb-4">
        Enter your <span className="font-semibold">Guest ID</span> to view your booking history and messages.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          value={guestIdInput}
          onChange={(e) => setGuestIdInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onUseGuestId()}
          placeholder="Guest ID (UUID)"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
        />
        <button
          onClick={onUseGuestId}
          className="px-6 py-2.5 rounded-lg bg-[#1a365d] text-white font-semibold hover:bg-[#2d4a7c] transition-colors disabled:opacity-50"
          disabled={loading || !guestIdInput.trim()}
        >
          {loading ? 'Loading...' : 'Open'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Conversations List */}
        <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="font-semibold text-gray-900 mb-3">Conversations</div>
          {!guestId ? (
            <div className="text-gray-500 text-sm">Enter your Guest ID to see conversations.</div>
          ) : loading && conversations.length === 0 ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="text-gray-500 text-sm">No conversations found for this Guest ID.</div>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConversationId(c.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedConversationId === c.id 
                      ? "border-[#1a365d] bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-gray-900">{c.shop?.name || "Shop"}</div>
                  {c.last_message_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(c.last_message_at).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Panel */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col min-h-[520px]">
          <div className="font-semibold text-gray-900 mb-3">Messages</div>
          
          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-3 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No messages yet</div>
                ) : (
                  messages.map((m) => {
                    const fromGuest = isFromGuest(m);
                    return (
                      <div 
                        key={m.id} 
                        className={`flex ${fromGuest ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] rounded-lg p-3 ${
                            fromGuest 
                              ? 'bg-[#1a365d] text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{m.content || m.body || ""}</div>
                          <div className={`text-xs mt-1 ${fromGuest ? 'text-blue-200' : 'text-gray-500'}`}>
                            {new Date(m.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              
              {/* Message Input */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                    placeholder="Type a message…"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1a365d] focus:border-transparent"
                  />
                  <button 
                    onClick={onSend} 
                    disabled={!text.trim() || loading}
                    className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  💡 Tip: Your Guest ID is saved automatically. You can return anytime using the same ID.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Guest ID Display */}
      {guestId && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Your Guest ID:</span>{" "}
            <code className="bg-white px-2 py-1 rounded text-xs font-mono">{guestId}</code>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Save this ID to access your conversations from any device.
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function GuestInboxLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <p className="text-gray-600 mb-4">
        Enter your <span className="font-semibold">Guest ID</span> to view your booking history and messages.
      </p>
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-11 bg-gray-100 rounded-lg animate-pulse" />
        <div className="w-24 h-11 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm min-h-[520px]">
          <div className="h-6 w-24 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Loading...
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestInboxPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a365d] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Guest Inbox</h1>
        </div>
      </header>

      <Suspense fallback={<GuestInboxLoading />}>
        <GuestInboxContent />
      </Suspense>
    </div>
  );
}
