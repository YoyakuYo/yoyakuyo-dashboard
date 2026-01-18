"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
};

export default function GuestInboxPage() {
  const [guestIdInput, setGuestIdInput] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(GUEST_ID_STORAGE_KEY) || localStorage.getItem("guest_id");
    if (saved && saved.trim()) {
      setGuestId(saved.trim());
      setGuestIdInput(saved.trim());
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const auth = useMemo(() => ({ bookingToken: guestId || undefined }), [guestId]);

  const loadConversations = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await messagingFetch(`${apiUrl}/api/internal-messaging/conversations`, {
        bookingToken: id,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed to load conversations" }));
        throw new Error(e.error || "Failed to load conversations");
      }
      const data = await res.json();
      setConversations(data.conversations || []);
      const first = (data.conversations || [])[0];
      if (first?.id) setSelectedConversationId(first.id);
    } catch (e: any) {
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
      const res = await messagingFetch(`${apiUrl}/api/internal-messaging/conversations/${convId}/messages`, {
        bookingToken: guestId,
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed to load messages" }));
        throw new Error(e.error || "Failed to load messages");
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, guestId]);

  const onUseGuestId = async () => {
    const id = guestIdInput.trim();
    if (!id) return;
    // Only persist if it looks like a UUID; otherwise keep it in state only.
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
      const res = await messagingFetch(`${apiUrl}/api/internal-messaging/messages`, {
        bookingToken: guestId,
        method: "POST",
        body: { conversation_id: selectedConversationId, content },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Failed to send message" }));
        throw new Error(e.error || "Failed to send message");
      }
      await loadMessages(selectedConversationId);
    } catch (e: any) {
      setError(e?.message || "Failed to send");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Guest Inbox</h1>
        <p className="text-gray-600 mb-4">
          Enter your <span className="font-semibold">Guest ID</span> to view your booking history and messages.
        </p>

        <div className="flex gap-2 mb-6">
          <input
            value={guestIdInput}
            onChange={(e) => setGuestIdInput(e.target.value)}
            placeholder="Guest ID (UUID)"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={onUseGuestId}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold"
            disabled={loading}
          >
            Open
          </button>
        </div>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1 border rounded-xl p-3">
            <div className="font-semibold mb-2">Conversations</div>
            {conversations.length === 0 ? (
              <div className="text-gray-500 text-sm">No conversations yet.</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConversationId(c.id)}
                    className={`w-full text-left p-2 rounded-lg border ${
                      selectedConversationId === c.id ? "border-black" : "border-gray-200"
                    }`}
                  >
                    <div className="font-medium">{c.shop?.name || "Shop"}</div>
                    <div className="text-xs text-gray-500">{c.last_message_at || ""}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 border rounded-xl p-3 flex flex-col min-h-[520px]">
            <div className="font-semibold mb-2">Messages</div>
            <div className="flex-1 overflow-auto space-y-2">
              {messages.map((m) => (
                <div key={m.id} className="border rounded-lg p-2">
                  <div className="text-sm text-gray-900">{m.content || m.body || ""}</div>
                  <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <button onClick={onSend} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold">
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Tip: save your Guest ID. Use it anytime to return and continue the same conversation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


