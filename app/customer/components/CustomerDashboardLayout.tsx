"use client";

import { ReactNode } from "react";
import CustomerHeader from "./CustomerHeader";
import CustomerSidebar from "./CustomerSidebar";
import CustomerAIChatBubble from "./CustomerAIChatBubble";
import { useCustomerNotificationsHook } from "@/lib/useCustomerNotifications";
import CustomerNotificationBar from "./CustomerNotificationBar";
import { useCustomerNotifications } from "./CustomerNotificationContext";
import { useRouter } from "next/navigation";

function CustomerNotificationsWrapper({ children }: { children: ReactNode }) {
  useCustomerNotificationsHook();
  const { newNotification, setNewNotification } = useCustomerNotifications();
  const router = useRouter();

  const handleDismiss = () => {
    setNewNotification(null);
  };

  const handleViewBooking = (bookingId: string) => {
    setNewNotification(null);
    router.push(`/customer/bookings?highlight=${bookingId}`);
  };

  return (
    <>
      {children}
      {newNotification && (
        <CustomerNotificationBar
          notification={newNotification}
          onDismiss={handleDismiss}
          onViewBooking={handleViewBooking}
        />
      )}
    </>
  );
}

export default function CustomerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerNotificationsWrapper>
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader />
        <CustomerSidebar />
        <main className="lg:ml-64 pt-16 min-h-screen">
          {children}
        </main>
        <CustomerAIChatBubble />
      </div>
    </CustomerNotificationsWrapper>
  );
}

