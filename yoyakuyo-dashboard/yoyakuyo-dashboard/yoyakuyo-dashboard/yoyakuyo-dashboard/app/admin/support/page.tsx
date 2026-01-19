// Admin support contact page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SupportConversationList from "@/app/components/admin/SupportConversationList";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface SupportConversation {
  id: string;
  shop_id: string;
  booking_id: string | null;
  customer_type: 'web' | 'line' | 'guest';
  customer_ref: string;
  is_support_ticket: boolean;
  support_status: 'open' | 'in-progress' | 'resolved' | 'closed' | null;
  created_at: string;
  last_message_at: string | null;
  shops?: {
    id: string;
    name: string;
    address?: string;
  };
  bookings?: {
    id: string;
    status: string;
    service_id: string;
  };
  messages?: Message[];
}

export default function AdminSupportPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    user_type: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get user from Supabase Auth
  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error("Error getting user session:", error);
      } finally {
        setAuthLoading(false);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchSupportConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, filters.status, filters.user_type]);

  const fetchSupportConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.user_type) params.append("user_type", filters.user_type);

      const response = await fetch(`${apiUrl}/admin/support/conversations?${params}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load support conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error loading support conversations:", error);
      setError(error.message || "Failed to load support conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (conversationId: string) => {
    try {
      const response = await fetch(`${apiUrl}/admin/support/conversations/${conversationId}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data);
      }
    } catch (error: any) {
      console.error("Error loading conversation details:", error);
    }
  };

  const handleSelectConversation = (conversation: SupportConversation) => {
    setSelectedConversation(conversation);
    fetchConversationDetails(conversation.id);
  };

  const handleReply = async () => {
    if (!selectedConversation || !replyContent.trim()) {
      return;
    }

    try {
      setSendingReply(true);
      const response = await fetch(`${apiUrl}/admin/support/conversations/${selectedConversation.id}/reply`, {
        method: "POST",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent }),
      });

      if (response.ok) {
        setReplyContent("");
        fetchConversationDetails(selectedConversation.id);
        fetchSupportConversations();
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.replyFailed") || "Failed to send reply"));
      }
    } catch (error: any) {
      console.error("Error sending reply:", error);
      alert(error.message || (t("admin.replyFailed") || "Failed to send reply"));
    } finally {
      setSendingReply(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    router.push("/admin/login");
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("admin.support") || "Support"}
        </h1>
        <p className="text-gray-600">{t("admin.supportDesc") || "Manage support tickets from shop owners and customers"}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchSupportConversations}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t("common.refresh") || "Refresh"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByStatus") || "Filter by Status"}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.allStatuses") || "All Statuses"}</option>
              <option value="open">{t("admin.open") || "Open"}</option>
              <option value="in-progress">{t("admin.inProgress") || "In Progress"}</option>
              <option value="resolved">{t("admin.resolved") || "Resolved"}</option>
              <option value="closed">{t("admin.closed") || "Closed"}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByUserType") || "Filter by User Type"}
            </label>
            <select
              value={filters.user_type}
              onChange={(e) => setFilters({ ...filters, user_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.allUserTypes") || "All User Types"}</option>
              <option value="owner">{t("admin.owner") || "Owner"}</option>
              <option value="customer">{t("admin.customer") || "Customer"}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchSupportConversations}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {t("common.refresh") || "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("admin.supportTickets") || "Support Tickets"}
          </h2>
          <SupportConversationList
            conversations={conversations}
            loading={loading}
            onRefresh={fetchSupportConversations}
            onSelectConversation={handleSelectConversation}
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("common.previous") || "Previous"}
              </button>
              <span className="text-gray-600">
                {t("admin.page") || "Page"} {page} {t("admin.of") || "of"} {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("common.next") || "Next"}
              </button>
            </div>
          )}
        </div>

        {/* Conversation Details & Reply */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedConversation ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t("admin.conversationDetails") || "Conversation Details"}
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">{t("admin.shop") || "Shop"}:</p>
                  <p className="text-gray-900">{selectedConversation.shops?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("admin.userType") || "User Type"}:</p>
                  <p className="text-gray-900">
                    {selectedConversation.customer_type === 'line' ? (t("admin.line") || "LINE") :
                     selectedConversation.customer_type === 'web' ? (t("admin.web") || "Web") :
                     (t("admin.guest") || "Guest")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("admin.status") || "Status"}:</p>
                  <p className="text-gray-900">{selectedConversation.support_status || "open"}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("admin.messages") || "Messages"}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedConversation.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.sender_id.includes('admin') || message.sender_id === 'admin'
                          ? "bg-blue-50 ml-8"
                          : "bg-gray-50 mr-8"
                      }`}
                    >
                      <p className="text-sm text-gray-900">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("admin.reply") || "Reply"}
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                  rows={4}
                  placeholder={t("admin.typeReply") || "Type your reply..."}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || sendingReply}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? (t("common.loading") || "Sending...") : (t("admin.sendReply") || "Send Reply")}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>{t("admin.selectConversation") || "Select a conversation to view details and reply"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

