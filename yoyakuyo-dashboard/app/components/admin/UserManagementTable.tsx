// User management table component
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  user_type: "admin" | "owner" | "customer"; // All user types
  role: "guest" | "customer" | "owner"; // Customer role
  is_admin: boolean; // Admin flag
}

interface UserManagementTableProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

export default function UserManagementTable({
  users,
  loading,
  onRefresh,
}: UserManagementTableProps) {
  const t = useTranslations();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<Record<string, string>>({});
  const [showBanModal, setShowBanModal] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const handleBan = async (userId: string) => {
    if (!confirm(t("admin.confirmBan"))) {
      return;
    }

    try {
      setProcessingId(userId);
      const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_banned: true,
          banned_reason: banReason[userId] || null,
        }),
      });

      if (response.ok) {
        onRefresh();
        setShowBanModal(null);
        setBanReason({ ...banReason, [userId]: "" });
      } else {
        const error = await response.json();
        alert(error.error || t("admin.banFailed"));
      }
    } catch (error: any) {
      console.error("Error banning user:", error);
      alert(error.message || t("admin.banFailed"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm(t("admin.confirmUnban"))) {
      return;
    }

    try {
      setProcessingId(userId);
      const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_banned: false,
        }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || t("admin.unbanFailed"));
      }
    } catch (error: any) {
      console.error("Error unbanning user:", error);
      alert(error.message || t("admin.unbanFailed"));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noUsersFound") || "No users found"}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.name") || "Name"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("common.email") || "Email"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.type") || "Type"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.role") || "Role"}
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
            {users.map((user) => (
              <tr key={user.id} className={user.is_banned ? "bg-red-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.user_type === 'admin' ? 'bg-blue-100 text-blue-800' :
                    user.user_type === 'owner' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.user_type === 'admin' ? (t("admin.admin") || "Admin") :
                     user.user_type === 'owner' ? (t("admin.owner") || "Owner") :
                     (t("admin.customer") || "Customer")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.role && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {user.role === 'web' ? (t("admin.web") || "Web") :
                       user.role === 'line' ? (t("admin.line") || "LINE") :
                       user.role === 'guest' ? (t("admin.guest") || "Guest") :
                       user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.is_banned ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {t("admin.banned") || "Banned"}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {t("admin.active") || "Active"}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.is_banned ? (
                    <button
                      onClick={() => handleUnban(user.id)}
                      disabled={processingId === user.id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      {processingId === user.id
                        ? (t("common.loading") || "Loading")
                        : (t("admin.unban") || "Unban")}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBanModal(user.id)}
                      disabled={processingId === user.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {t("admin.ban") || "Ban"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">{t("admin.banUser") || "Ban User"}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.banReason") || "Ban Reason"} ({t("common.optional") || "Optional"})
            </label>
            <textarea
              value={banReason[showBanModal] || ""}
              onChange={(e) =>
                setBanReason({ ...banReason, [showBanModal]: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBanModal(null);
                  setBanReason({ ...banReason, [showBanModal]: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                    {t("common.cancel") || "Cancel"}
                  </button>
                  <button
                    onClick={() => {
                      const user = users.find((u) => u.id === showBanModal);
                      if (user) {
                        handleBan(user.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    {t("admin.ban") || "Ban"}
                  </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

