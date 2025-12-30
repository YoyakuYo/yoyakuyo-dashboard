// apps/dashboard/app/book/[shopId]/page.tsx

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';

interface Service {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

interface Timeslot {
  id: string;
  start_time: string;
  end_time: string;
}

interface ChatMessage {
  id: string;
  senderType: 'customer' | 'owner' | 'ai';
  content: string;
  createdAt: string;
  readByOwner: boolean;
  readByCustomer: boolean;
}

export default function PublicBookingPage() {
  const params = useParams();
  const shopId = params?.shopId as string;
  const t = useTranslations();
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Chat state
  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  
  // Anonymous session ID for public visitors
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  
  // LINE QR code state
  const [lineQrUrl, setLineQrUrl] = useState<string | null>(null);
  const [lineDeeplinkUrl, setLineDeeplinkUrl] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize anonymous session ID on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('yoyaku_yo_anonymous_session');
      if (!sessionId) {
        sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('yoyaku_yo_anonymous_session', sessionId);
      }
      setAnonymousSessionId(sessionId);
    }
  }, []);

  // Load LINE QR code on mount
  useEffect(() => {
    if (shopId) {
      const loadQrCode = async () => {
        try {
          const res = await fetch(`${apiUrl}/qr/shop/${shopId}/line`);
          if (res.ok) {
            const data = await res.json();
            setLineQrUrl(data.qrImageUrl);
            setLineDeeplinkUrl(data.deeplinkUrl);
          }
        } catch (error) {
          // Silently handle errors
        }
      };
      loadQrCode();
    }
  }, [shopId, apiUrl]);

  // Initialize thread on mount
  useEffect(() => {
    if (shopId && !threadId && anonymousSessionId) {
      const startThread = async () => {
        try {
          const res = await fetch(`${apiUrl}/messages/start-thread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shopId,
              bookingId: null,
              threadType: 'customer', // Public visitors always use customer threads
              anonymousSessionId: anonymousSessionId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setThreadId(data.threadId);
            
            // Load message history
            loadMessages(data.threadId);
            
            // Subscribe to realtime updates
            subscribeToMessages(data.threadId);
          }
        } catch (error: any) {
          // Silently handle connection errors (API server not running)
          if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
            console.error('Error starting thread:', error);
          }
        }
      };

      startThread();
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        const supabase = getSupabaseClient();
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [shopId, threadId, apiUrl]);

  const loadMessages = async (threadIdToLoad: string) => {
    try {
      const url = anonymousSessionId 
        ? `${apiUrl}/messages/thread/${threadIdToLoad}?anonymousSessionId=${encodeURIComponent(anonymousSessionId)}`
        : `${apiUrl}/messages/thread/${threadIdToLoad}`;
      const res = await fetch(url);
      if (res.ok) {
        const messages = await res.json();
        setChatMessages(Array.isArray(messages) ? messages : []);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error loading messages:', error);
      }
    }
  };

  const subscribeToMessages = (threadIdToSubscribe: string) => {
    const supabase = getSupabaseClient();
    
    const channel = supabase
      .channel(`shop_messages:thread_id=eq.${threadIdToSubscribe}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shop_messages',
          filter: `thread_id=eq.${threadIdToSubscribe}`,
        },
        (payload: any) => {
          const newMessage = payload.new;
          if (newMessage && newMessage.thread_id === threadIdToSubscribe) {
            // Check if message already exists
            setChatMessages((prev) => {
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;
              
              return [
                ...prev,
                {
                  id: newMessage.id,
                  senderType: newMessage.sender_type,
                  content: newMessage.content,
                  createdAt: newMessage.created_at,
                  readByOwner: newMessage.read_by_owner || false,
                  readByCustomer: newMessage.read_by_customer || false,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const sendMessage = async () => {
    if (!threadId || !chatInput.trim() || chatLoading) return;

    const messageContent = chatInput.trim();
    setChatInput('');
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderType: 'customer',
      content: messageContent,
      createdAt: new Date().toISOString(),
      readByOwner: false,
      readByCustomer: true,
    };
    
    setChatMessages((prev) => [...prev, optimisticMessage]);
    setChatLoading(true);

    try {
      const res = await fetch(`${apiUrl}/messages/thread/${threadId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'customer',
          content: messageContent,
        }),
      });

      if (res.ok) {
        const sentMessage = await res.json();
        // Replace optimistic message with real one
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  id: sentMessage.id,
                  senderType: sentMessage.senderType,
                  content: sentMessage.content,
                  createdAt: sentMessage.createdAt,
                  readByOwner: sentMessage.readByOwner,
                  readByCustomer: sentMessage.readByCustomer,
                }
              : msg
          )
        );
      } else {
        // Remove optimistic message on error
        setChatMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        alert('Failed to send message. Please try again.');
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error sending message:', error);
      }
      setChatMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        alert('Failed to send message. Please try again.');
      }
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}/services`);
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch services:", res.status, res.statusText);
          setServices([]);
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error("Error fetching services:", error);
        }
        setServices([]);
      }
    };

    const fetchStaff = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}/staff`);
        if (res.ok) {
          const data = await res.json();
          setStaffMembers(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch staff:", res.status, res.statusText);
          setStaffMembers([]);
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error("Error fetching staff:", error);
        }
        setStaffMembers([]);
      }
    };

    fetchServices();
    fetchStaff();
  }, [shopId, apiUrl]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const fetchAvailability = async () => {
    if (selectedDate && selectedStaff) {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}/availability?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setTimeslots(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch availability:", res.status, res.statusText);
          setTimeslots([]);
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error("Error fetching availability:", error);
        }
        setTimeslots([]);
      }
    }
  };

  const bookAppointment = async () => {
    if (selectedService && selectedStaff && selectedDate && name) {
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0] || name;
      const last_name = nameParts.slice(1).join(' ') || null;

      try {
        const res = await fetch(`${apiUrl}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shop_id: shopId,
            service_id: selectedService,
            staff_id: selectedStaff,
            start_time: selectedDate,
            end_time: selectedDate,
            first_name: first_name,
            last_name: last_name,
            notes: `Booking for ${name}`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          alert(t('booking.bookingSuccessful'));
        } else {
          const errorData = await res.json().catch(() => ({ error: t('common.unknown') }));
          alert(`${t('booking.bookingFailed')}: ${errorData.error || t('common.tryAgain')}`);
        }
      } catch (error: any) {
        // Silently handle connection errors (API server not running)
        if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.error('Error creating booking:', error);
          alert(t('booking.bookingFailed'));
        }
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('booking.bookAppointment')}</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseService')}</h2>
            <select
              value={selectedService || ''}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('booking.selectService')}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseStaff')}</h2>
            <select
              value={selectedStaff || ''}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('booking.selectStaff')}</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseDate')}</h2>
            <input
              type="date"
              value={selectedDate || ''}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="mb-6">
            <button
              onClick={fetchAvailability}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('booking.checkAvailability')}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.chooseTimeslot')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {timeslots.map((timeslot) => (
                <button
                  key={timeslot.id}
                  onClick={() => alert(t('booking.timeslotSelected'))}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {timeslot.start_time} - {timeslot.end_time}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t('booking.yourInformation')}</h2>
            <input
              type="text"
              placeholder={t('booking.yourName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
            />
            <input
              type="email"
              placeholder={t('booking.yourEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={bookAppointment}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            {t('booking.submit')}
          </button>
        </div>

        {/* LINE QR Code Section */}
        {lineQrUrl && lineDeeplinkUrl && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">LINEで予約 / LINE でお問い合わせ</h2>
            <div className="flex flex-col items-center space-y-4">
              {lineQrUrl && (
                <div className="flex flex-col items-center">
                  <img 
                    src={lineQrUrl} 
                    alt="LINE QR Code" 
                    className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                  />
                  <p className="mt-2 text-sm text-gray-600 text-center">LINEで予約はこちら</p>
                </div>
              )}
              {lineDeeplinkUrl && (
                <a
                  href={lineDeeplinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  LINEで予約はこちら
                </a>
              )}
            </div>
          </div>
        )}

        {/* Chat with AI Assistant */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Chat with AI Assistant</h2>
            <button
              onClick={() => setShowChat(!showChat)}
              className="text-gray-600 hover:text-gray-900"
            >
              {showChat ? '−' : '+'}
            </button>
          </div>

          {showChat && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🤖</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Start a conversation</h3>
                      <p className="text-gray-600">
                        Ask me anything about booking! I can help with appointments, availability, and more.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.senderType === 'customer' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.senderType !== 'customer' && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">
                              {message.senderType === 'ai' ? '🤖' : '👤'}
                            </span>
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-3 ${
                            message.senderType === 'customer'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              message.senderType === 'customer' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                        {message.senderType === 'customer' && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-600">You</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🤖</span>
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
