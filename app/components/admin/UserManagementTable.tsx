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
  role: "super_admin" | "support" | "guest" | "web" | "line"; // Admin roles or customer roles
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
  const [showContactModal, setShowContactModal] = useState<string | null>(null);
  const [showBanConfirmModal, setShowBanConfirmModal] = useState<string | null>(null);
  const [showUnbanConfirmModal, setShowUnbanConfirmModal] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState<Record<string, string>>({});

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

  const handleSendMessage = async (user: any) => {
    const message = contactMessage[user.id];
    if (!message || !message.trim()) {
      alert("Please enter a message");
      return;
    }

    // Determine customer_type and customer_ref based on user type and role
    let customerType: 'web' | 'line' | 'guest';
    let customerRef: string;
    let shopId: string | undefined;

    if (user.user_type === 'owner' || (user.user_type === 'customer' && user.role === 'web')) {
      customerType = 'web';
      customerRef = user.auth_user_id || user.id;
    } else if (user.user_type === 'customer' && user.role === 'line') {
      customerType = 'line';
      customerRef = user.auth_user_id || user.id; // Could be line_user_id if available
      // For LINE customers, we need to find a shop they have interacted with
      // Check if they have any bookings first
      try {
        const bookingsResponse = await fetch(`${apiUrl}/bookings?customer_id=${user.id}&limit=1`, {
          headers: {
            "x-user-id": currentUserId || "",
            "Content-Type": "application/json",
          },
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          if (bookingsData.bookings && bookingsData.bookings.length > 0) {
            shopId = bookingsData.bookings[0].shop_id;
          }
        }
      } catch (error) {
        console.warn("Could not find shop for LINE customer from bookings:", error);
      }

      // If still no shop found for LINE customer, show error
      if (!shopId) {
        alert("Cannot contact LINE customer: no associated shop found. The customer must have made a booking first.");
        return;
      }
    } else if (user.user_type === 'customer' && user.role === 'guest') {
      customerType = 'guest';
      customerRef = user.email || user.id;
      // For guest customers, we need to find a shop they have interacted with
      try {
        const bookingsResponse = await fetch(`${apiUrl}/bookings?customer_id=${user.id}&limit=1`, {
          headers: {
            "x-user-id": currentUserId || "",
            "Content-Type": "application/json",
          },
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          if (bookingsData.bookings && bookingsData.bookings.length > 0) {
            shopId = bookingsData.bookings[0].shop_id;
          }
        }
      } catch (error) {
        console.warn("Could not find shop for guest customer from bookings:", error);
      }

      // If still no shop found for guest customer, show error
      if (!shopId) {
        alert("Cannot contact guest customer: no associated shop found. The customer must have made a booking first.");
        return;
      }
    } else {
      alert("Cannot contact this user type");
      return;
    }

    try {
      setProcessingId(user.id);
      const requestBody: any = {
        customer_ref: customerRef,
        customer_type: customerType,
        content: message.trim(),
      };

      // Add shop_id if we found one (required for LINE customers)
      if (customerType === 'line' && shopId) {
        requestBody.shop_id = shopId;
      }

      const response = await fetch(`${apiUrl}/admin/support/conversations/create`, {
        method: "POST",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert("Message sent successfully!");
        setShowContactModal(null);
        setContactMessage({ ...contactMessage, [user.id]: "" });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(error.message || "Failed to send message");
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.user_type === 'admin' 
                        ? (user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.user_type === 'admin' 
                        ? (user.role === 'super_admin' ? (t("admin.superAdmin") || "Super Admin") : (t("admin.support") || "Support"))
                        : (user.role === 'web' ? (t("admin.web") || "Web") :
                           user.role === 'line' ? (t("admin.line") || "LINE") :
                           user.role === 'guest' ? (t("admin.guest") || "Guest") :
                           user.role)}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {user.user_type === 'admin' ? (
                    // Admins cannot be banned/unbanned by other admins
                    <span className="text-gray-400 text-xs">Protected</span>
                  ) : (
                    <>
                      {/* Contact Button */}
                      <button
                        onClick={() => setShowContactModal(user.id)}
                        disabled={processingId === user.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Contact
                      </button>

                      {/* Ban/Unban Button */}
                      {user.is_banned ? (
                        <button
                          onClick={() => setShowUnbanConfirmModal(user.id)}
                          disabled={processingId === user.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {processingId === user.id
                            ? (t("common.loading") || "Loading")
                            : (t("admin.unban") || "Unban")}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowBanConfirmModal(user.id)}
                          disabled={processingId === user.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {t("admin.ban") || "Ban"}
                        </button>
                      )}
                    </>
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

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Contact User</h3>
            {(() => {
              const user = users.find((u) => u.id === showContactModal);
              return user ? (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>{user.name || "Unknown"}</strong> ({user.user_type})
                    {user.email && <span> - {user.email}</span>}
                  </p>
                </div>
              ) : null;
            })()}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={contactMessage[showContactModal] || ""}
              onChange={(e) =>
                setContactMessage({ ...contactMessage, [showContactModal]: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              rows={4}
              placeholder="Type your message to the user..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowContactModal(null);
                  setContactMessage({ ...contactMessage, [showContactModal]: "" });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => {
                  const user = users.find((u) => u.id === showContactModal);
                  if (user) {
                    handleSendMessage(user);
                  }
                }}
                disabled={processingId === showContactModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processingId === showContactModal ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {showBanConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">Confirm Ban</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to ban this user? They will be unable to access the platform.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBanConfirmModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => {
                  setShowBanConfirmModal(null);
                  setShowBanModal(showBanConfirmModal); // Show ban reason modal
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Continue to Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {showUnbanConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-green-600">Confirm Unban</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to unban this user? They will regain access to the platform.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUnbanConfirmModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => {
                  const user = users.find((u) => u.id === showUnbanConfirmModal);
                  if (user) {
                    setShowUnbanConfirmModal(null);
                    handleUnban(user.id);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {t("admin.unban") || "Unban User"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

