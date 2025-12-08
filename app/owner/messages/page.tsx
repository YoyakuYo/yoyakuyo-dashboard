// app/owner/messages/page.tsx
// Owner messages page - Customer and Staff messaging tabs

"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

interface CustomerThread {
  id: string;
  session_id: string;
  shop_id: string;
  shop_name?: string;
  customer_email?: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface StaffThread {
  id: string;
  shop_id: string;
  staff_id: string;
  shop?: { id: string; name: string };
  staff?: { id: string; email: string; full_name?: string };
  last_message_at: string;
}

interface Message {
  id: string;
  role?: string;
  sender_type?: 'customer' | 'owner' | 'staff';
  content: string;
  created_at: string;
}

export default function OwnerMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'customers' | 'staff'>('customers');
  const [customerThreads, setCustomerThreads] = useState<CustomerThread[]>([]);
  const [staffThreads, setStaffThreads] = useState<StaffThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadData();
    }
  }, [user, authLoading, router, activeTab]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
    }
  }, [selectedThread, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (activeTab === 'customers') {
        await loadCustomerThreads();
      } else {
        await loadStaffThreads();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerThreads = async () => {
    if (!user?.id) return;
    try {
      // Get owner's shops first
      const shopsRes = await fetch(`${apiUrl}/api/owner/shops`, {
        headers: { 'x-user-id': user.id },
      });
      if (!shopsRes.ok) {
        setCustomerThreads([]);
        return;
      }
      const shopsData = await shopsRes.json();
      const shops = shopsData.shops || [];

      if (shops.length === 0) {
        setCustomerThreads([]);
        return;
      }

      // Get threads for all shops
      const threadsRes = await fetch(`${apiUrl}/messages/owner/threads`, {
        headers: { 'x-user-id': user.id },
      });
      if (threadsRes.ok) {
        const threadsData = await threadsRes.json();
        // Format threads for customer messages
        const formattedThreads: CustomerThread[] = (threadsData.threads || []).map((t: any) => ({
          id: t.session_id || t.id,
          session_id: t.session_id || t.id,
          shop_id: t.shop_id,
          shop_name: t.shop?.name,
          customer_email: t.customer_email,
          lastMessageAt: t.updated_at || t.created_at,
          unreadCount: t.unreadCount || 0,
        }));
        setCustomerThreads(formattedThreads);
      }
    } catch (error) {
      console.error('Error loading customer threads:', error);
      setCustomerThreads([]);
    }
  };

  const loadStaffThreads = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/messages/owner/threads`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Error loading staff threads:', error);
      setStaffThreads([]);
    }
  };

  const loadMessages = async (threadId: string) => {
    if (!user?.id) return;
    try {
      if (activeTab === 'customers') {
        const res = await fetch(`${apiUrl}/messages/thread/${threadId}`, {
          headers: { 'x-user-id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data || []);
        }
      } else {
        const res = await fetch(`${apiUrl}/api/staff/messages/${threadId}`, {
          headers: { 'x-user-id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedThread || sending || !user?.id) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);

    try {
      if (activeTab === 'customers') {
        const res = await fetch(`${apiUrl}/messages/thread/${selectedThread}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ message: messageText }),
        });
        if (res.ok) {
          await loadMessages(selectedThread);
        }
      } else {
        const res = await fetch(`${apiUrl}/api/staff/messages/${selectedThread}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ message: messageText }),
        });
        if (res.ok) {
          await loadMessages(selectedThread);
          await loadStaffThreads();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('customers');
              setSelectedThread(null);
              setMessages([]);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => {
              setActiveTab('staff');
              setSelectedThread(null);
              setMessages([]);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'staff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Staff
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-250px)]">
        {/* Threads List */}
        <div className="w-80 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {activeTab === 'customers' ? 'Customer Conversations' : 'Staff Conversations'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'customers' ? (
              customerThreads.length > 0 ? (
                <div className="divide-y">
                  {customerThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.session_id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedThread === thread.session_id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">
                        {thread.shop_name || 'Shop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {thread.customer_email || 'Customer'}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                          {thread.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-gray-500">No customer conversations</p>
              )
            ) : (
              staffThreads.length > 0 ? (
                <div className="divide-y">
                  {staffThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedThread === thread.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">
                        {thread.shop?.name || 'Shop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {thread.staff?.full_name || thread.staff?.email || 'Staff'}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-gray-500">No staff conversations</p>
              )
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {activeTab === 'customers'
                    ? customerThreads.find(t => t.session_id === selectedThread)?.customer_email || 'Customer'
                    : staffThreads.find(t => t.id === selectedThread)?.staff?.full_name || 'Staff'}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        (message.role === 'assistant' || message.sender_type === 'owner') 
                          ? 'justify-end' 
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          (message.role === 'assistant' || message.sender_type === 'owner')
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

