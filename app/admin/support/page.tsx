// Admin support contact page
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import SupportConversationList from "@/app/components/admin/SupportConversationList";

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
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  attachments?: Attachment[];
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
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
  const [documentRequestText, setDocumentRequestText] = useState("");
  const [sendingDocumentRequest, setSendingDocumentRequest] = useState(false);
  const [showConvertToDisputeModal, setShowConvertToDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    dispute_type: 'other',
    title: '',
    description: ''
  });
  const [convertingToDispute, setConvertingToDispute] = useState(false);

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

  const handleRequestDocument = async () => {
    if (!selectedConversation || !documentRequestText.trim()) {
      return;
    }

    try {
      setSendingDocumentRequest(true);
      // Format message as a document request
      const requestMessage = `📎 **Document Request**\n\n${documentRequestText.trim()}\n\nPlease upload the requested document as an attachment.`;
      
      const response = await fetch(`${apiUrl}/admin/support/conversations/${selectedConversation.id}/reply`, {
        method: "POST",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: requestMessage }),
      });

      if (response.ok) {
        setDocumentRequestText("");
        setShowDocumentRequestModal(false);
        fetchConversationDetails(selectedConversation.id);
        fetchSupportConversations();
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.requestFailed") || "Failed to send document request"));
      }
    } catch (error: any) {
      console.error("Error sending document request:", error);
      alert(error.message || (t("admin.requestFailed") || "Failed to send document request"));
    } finally {
      setSendingDocumentRequest(false);
    }
  };

  const handleSearchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`${apiUrl}/admin/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.searchFailed") || "Failed to search users"));
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      alert(error.message || (t("admin.searchFailed") || "Failed to search users"));
    } finally {
      setSearching(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser || !newMessageContent.trim()) {
      return;
    }

    try {
      setCreatingConversation(true);
      const response = await fetch(`${apiUrl}/admin/support/conversations/create`, {
        method: "POST",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_ref: selectedUser.customer_ref,
          customer_type: selectedUser.customer_type,
          shop_id: selectedUser.shop_id || null,
          content: newMessageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewConversationModal(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedUser(null);
        setNewMessageContent("");
        fetchSupportConversations();
        // Select the newly created conversation
        if (data.conversation) {
          handleSelectConversation(data.conversation);
        }
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.createFailed") || "Failed to create conversation"));
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      alert(error.message || (t("admin.createFailed") || "Failed to create conversation"));
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleConvertToDispute = async () => {
    if (!selectedConversation || !disputeForm.title.trim() || !disputeForm.description.trim()) {
      return;
    }

    try {
      setConvertingToDispute(true);
      const response = await fetch(`${apiUrl}/admin/support/conversations/${selectedConversation.id}/convert-to-dispute`, {
        method: "POST",
        headers: {
          "x-user-id": userId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dispute_type: disputeForm.dispute_type,
          title: disputeForm.title,
          description: disputeForm.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowConvertToDisputeModal(false);
        setDisputeForm({ dispute_type: 'other', title: '', description: '' });
        fetchSupportConversations();
        fetchConversationDetails(selectedConversation.id);
        alert(t("admin.disputeCreated") || "Support ticket has been converted to a dispute");
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.convertFailed") || "Failed to convert to dispute"));
      }
    } catch (error: any) {
      console.error("Error converting to dispute:", error);
      alert(error.message || (t("admin.convertFailed") || "Failed to convert to dispute"));
    } finally {
      setConvertingToDispute(false);
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

      {/* Filters and New Conversation Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t("admin.newConversation") || "New Conversation"}
            </button>
            <button
              onClick={fetchSupportConversations}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                  {selectedConversation.messages?.map((message) => {
                    const isAdminMessage = message.sender_id.includes('admin') || message.sender_id === 'admin';
                    const isDocumentRequest = message.content.includes('📎 **Document Request**');
                    
                    return (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          isAdminMessage
                            ? "bg-blue-50 ml-8"
                            : "bg-gray-50 mr-8"
                        } ${isDocumentRequest ? 'border-2 border-green-300' : ''}`}
                      >
                        {isDocumentRequest && (
                          <div className="mb-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            📎 Document Request
                          </div>
                        )}
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Display attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((att: Attachment) => (
                              <a
                                key={att.id}
                                href={att.signed_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs bg-white border border-gray-300 hover:bg-gray-50"
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
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowConvertToDisputeModal(true)}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    ⚖️ {t("admin.convertToDispute") || "Convert to Dispute"}
                  </button>
                  <button
                    onClick={() => setShowDocumentRequestModal(true)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📎 {t("admin.requestDocument") || "Request Document"}
                  </button>
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

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("admin.newConversation") || "New Conversation"}
                </h2>
                <button
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    setSelectedUser(null);
                    setNewMessageContent("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {!selectedUser ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("admin.searchUser") || "Search for Customer or Owner"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={async (e) => {
                          if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                            await handleSearchUsers();
                          }
                        }}
                        placeholder={t("admin.searchPlaceholder") || "Enter name or email..."}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        onClick={handleSearchUsers}
                        disabled={searchQuery.trim().length < 2 || searching}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {searching ? (t("common.loading") || "Searching...") : (t("common.search") || "Search")}
                      </button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {user.type === 'owner' ? (t("admin.owner") || "Owner") : (t("admin.customer") || "Customer")}
                            {user.shop_name && ` • ${user.shop_name}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
                    <div className="text-center py-4 text-gray-500">
                      {t("admin.noUsersFound") || "No users found"}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {selectedUser.type === 'owner' ? (t("admin.owner") || "Owner") : (t("admin.customer") || "Customer")}
                      {selectedUser.shop_name && ` • ${selectedUser.shop_name}`}
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {t("admin.changeUser") || "Change user"}
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("admin.message") || "Message"}
                    </label>
                    <textarea
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      placeholder={t("admin.messagePlaceholder") || "Enter your message..."}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateConversation}
                      disabled={!newMessageContent.trim() || creatingConversation}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {creatingConversation ? (t("common.loading") || "Creating...") : (t("admin.createConversation") || "Create Conversation")}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewConversationModal(false);
                        setSearchQuery("");
                        setSearchResults([]);
                        setSelectedUser(null);
                        setNewMessageContent("");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convert to Dispute Modal */}
      {showConvertToDisputeModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {t("admin.convertToDispute") || "Convert to Dispute"}
                </h2>
                <button
                  onClick={() => {
                    setShowConvertToDisputeModal(false);
                    setDisputeForm({ dispute_type: 'other', title: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.disputeType") || "Dispute Type"}
                  </label>
                  <select
                    value={disputeForm.dispute_type}
                    onChange={(e) => setDisputeForm({ ...disputeForm, dispute_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="booking_issue">{t("admin.bookingIssue") || "Booking Issue"}</option>
                    <option value="payment_issue">{t("admin.paymentIssue") || "Payment Issue"}</option>
                    <option value="service_quality">{t("admin.serviceQuality") || "Service Quality"}</option>
                    <option value="shop_claim">{t("admin.shopClaim") || "Shop Claim"}</option>
                    <option value="account_issue">{t("admin.accountIssue") || "Account Issue"}</option>
                    <option value="other">{t("admin.other") || "Other"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.title") || "Title"}
                  </label>
                  <input
                    type="text"
                    value={disputeForm.title}
                    onChange={(e) => setDisputeForm({ ...disputeForm, title: e.target.value })}
                    placeholder={t("admin.disputeTitlePlaceholder") || "Brief dispute title"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("admin.description") || "Description"}
                  </label>
                  <textarea
                    value={disputeForm.description}
                    onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                    placeholder={t("admin.disputeDescriptionPlaceholder") || "Detailed description of the dispute"}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleConvertToDispute}
                  disabled={!disputeForm.title.trim() || !disputeForm.description.trim() || convertingToDispute}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {convertingToDispute ? (t("common.loading") || "Converting...") : (t("admin.convertToDispute") || "Convert to Dispute")}
                </button>
                <button
                  onClick={() => {
                    setShowConvertToDisputeModal(false);
                    setDisputeForm({ dispute_type: 'other', title: '', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

