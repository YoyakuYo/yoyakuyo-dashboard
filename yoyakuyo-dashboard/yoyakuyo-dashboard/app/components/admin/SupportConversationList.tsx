// Support conversation list component
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

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

interface SupportConversationListProps {
  conversations: SupportConversation[];
  loading: boolean;
  onRefresh: () => void;
  onSelectConversation: (conversation: SupportConversation) => void;
}

export default function SupportConversationList({
  conversations,
  loading,
  onRefresh,
  onSelectConversation,
}: SupportConversationListProps) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  React.useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const handleStatusUpdate = async (conversationId: string, newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    try {
      setProcessingId(conversationId);
      const response = await fetch(`${apiUrl}/admin/support/conversations/${conversationId}/status`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || (t("admin.updateFailed") || "Failed to update status"));
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(error.message || (t("admin.updateFailed") || "Failed to update status"));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">{t("common.loading") || "Loading..."}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noSupportTickets") || "No support tickets found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.ticketId") || "Ticket ID"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.userType") || "User Type"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.shop") || "Shop"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.status") || "Status"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("common.date") || "Date"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("common.actions") || "Actions"}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <tr
              key={conversation.id}
              className={`cursor-pointer hover:bg-gray-50 ${selectedId === conversation.id ? "bg-blue-50" : ""}`}
              onClick={() => {
                setSelectedId(conversation.id);
                onSelectConversation(conversation);
              }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {conversation.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  conversation.customer_type === 'owner' ? 'bg-purple-100 text-purple-800' :
                  conversation.customer_type === 'web' ? 'bg-gray-100 text-gray-800' :
                  conversation.customer_type === 'line' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {conversation.customer_type === 'owner' ? (t("admin.owner") || "Owner") :
                   conversation.customer_type === 'web' ? (t("admin.web") || "Web") :
                   conversation.customer_type === 'line' ? (t("admin.line") || "LINE") :
                   (t("admin.guest") || "Guest")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {conversation.shops?.name || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.support_status)}`}>
                  {conversation.support_status === 'open' ? (t("admin.open") || "Open") :
                   conversation.support_status === 'in-progress' ? (t("admin.inProgress") || "In Progress") :
                   conversation.support_status === 'resolved' ? (t("admin.resolved") || "Resolved") :
                   conversation.support_status === 'closed' ? (t("admin.closed") || "Closed") :
                   (t("admin.open") || "Open")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(conversation.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <select
                  value={conversation.support_status || 'open'}
                  onChange={(e) => handleStatusUpdate(conversation.id, e.target.value as any)}
                  disabled={processingId === conversation.id}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                >
                  <option value="open">{t("admin.open") || "Open"}</option>
                  <option value="in-progress">{t("admin.inProgress") || "In Progress"}</option>
                  <option value="resolved">{t("admin.resolved") || "Resolved"}</option>
                  <option value="closed">{t("admin.closed") || "Closed"}</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

