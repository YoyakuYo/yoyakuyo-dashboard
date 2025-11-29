"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function CustomerNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_type", "customer")
      .eq("recipient_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading notifications:", error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("customer-notifications-subscription")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_type=eq.customer&recipient_id=eq.${user?.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_type", "customer")
      .eq("recipient_id", user?.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all as read:", error);
    } else {
      loadNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow ${
                !notification.is_read ? "border-l-4 border-blue-600" : ""
              }`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{notification.body}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

