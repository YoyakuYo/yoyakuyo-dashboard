// app/customer/components/CustomerNotificationContext.tsx
// Context for managing customer notification state

"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomerNotification {
  id: string;
  title: string;
  body: string;
  bookingId?: string;
  status?: string;
}

interface CustomerNotificationContextType {
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;
  unreadBookingsCount: number;
  setUnreadBookingsCount: (count: number) => void;
  newNotification: CustomerNotification | null;
  setNewNotification: (notification: CustomerNotification | null) => void;
}

const CustomerNotificationContext = createContext<CustomerNotificationContextType | undefined>(undefined);

export function CustomerNotificationProvider({ children }: { children: ReactNode }) {
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadBookingsCount, setUnreadBookingsCount] = useState(0);
  const [newNotification, setNewNotification] = useState<CustomerNotification | null>(null);

  return (
    <CustomerNotificationContext.Provider
      value={{
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        unreadBookingsCount,
        setUnreadBookingsCount,
        newNotification,
        setNewNotification,
      }}
    >
      {children}
    </CustomerNotificationContext.Provider>
  );
}

export function useCustomerNotifications() {
  const context = useContext(CustomerNotificationContext);
  if (context === undefined) {
    throw new Error('useCustomerNotifications must be used within CustomerNotificationProvider');
  }
  return context;
}

