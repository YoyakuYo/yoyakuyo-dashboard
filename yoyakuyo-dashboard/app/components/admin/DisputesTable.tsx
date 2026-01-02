// Disputes management table component
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Dispute {
  id: string;
  user_id: string;
  user_type: 'owner' | 'customer' | 'admin';
  booking_id: string | null;
  conversation_id: string | null;
  shop_id: string | null;
  dispute_type: 'booking_issue' | 'payment_issue' | 'service_quality' | 'shop_claim' | 'account_issue' | 'other';
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed' | 'escalated';
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  shops?: {
    id: string;
    name: string;
    address?: string;
  };
  bookings?: {
    id: string;
    status: string;
    booking_date: string;
  };
  conversations?: {
    id: string;
    customer_type: string;
    customer_ref: string;
  };
}

interface DisputesTableProps {
  disputes: Dispute[];
  loading: boolean;
  onRefresh: () => void;
  onSelectDispute: (dispute: Dispute) => void;
}

export default function DisputesTable({
  disputes,
  loading,
  onRefresh,
  onSelectDispute,
}: DisputesTableProps) {
  const t = useTranslations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const handleStatusUpdate = async (disputeId: string, newStatus: string) => {
    try {
      setProcessingId(disputeId);
      const response = await fetch(`${apiUrl}/admin/disputes/${disputeId}/status`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    switch (type) {
      case 'booking_issue':
        return t("admin.bookingIssue") || "Booking Issue";
      case 'payment_issue':
        return t("admin.paymentIssue") || "Payment Issue";
      case 'service_quality':
        return t("admin.serviceQuality") || "Service Quality";
      case 'shop_claim':
        return t("admin.shopClaim") || "Shop Claim";
      case 'account_issue':
        return t("admin.accountIssue") || "Account Issue";
      case 'other':
      default:
        return t("admin.other") || "Other";
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

  if (disputes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noDisputesFound") || "No disputes found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.disputeId") || "Dispute ID"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.title") || "Title"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.type") || "Type"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.userType") || "User Type"}
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
          {disputes.map((dispute) => (
            <tr
              key={dispute.id}
              className={`cursor-pointer hover:bg-gray-50 ${selectedId === dispute.id ? "bg-blue-50" : ""}`}
              onClick={() => {
                setSelectedId(dispute.id);
                onSelectDispute(dispute);
              }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {dispute.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {dispute.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {getDisputeTypeLabel(dispute.dispute_type)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  dispute.user_type === 'owner' ? 'bg-purple-100 text-purple-800' :
                  dispute.user_type === 'customer' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {dispute.user_type === 'owner' ? (t("admin.owner") || "Owner") :
                   dispute.user_type === 'customer' ? (t("admin.customer") || "Customer") :
                   (t("admin.admin") || "Admin")}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                  {dispute.status === 'open' ? (t("admin.open") || "Open") :
                   dispute.status === 'investigating' ? (t("admin.investigating") || "Investigating") :
                   dispute.status === 'resolved' ? (t("admin.resolved") || "Resolved") :
                   dispute.status === 'closed' ? (t("admin.closed") || "Closed") :
                   dispute.status === 'escalated' ? (t("admin.escalated") || "Escalated") :
                   dispute.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(dispute.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <select
                  value={dispute.status}
                  onChange={(e) => handleStatusUpdate(dispute.id, e.target.value)}
                  disabled={processingId === dispute.id}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                >
                  <option value="open">{t("admin.open") || "Open"}</option>
                  <option value="investigating">{t("admin.investigating") || "Investigating"}</option>
                  <option value="resolved">{t("admin.resolved") || "Resolved"}</option>
                  <option value="closed">{t("admin.closed") || "Closed"}</option>
                  <option value="escalated">{t("admin.escalated") || "Escalated"}</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

