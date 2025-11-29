// apps/dashboard/app/components/BookingNotificationContext.tsx
// Context for managing booking notification badge count

"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BookingNotification {
  id: string;
  customerName: string;
  serviceName?: string;
  date: string;
  time: string;
  isAICreated: boolean;
}

interface BookingNotificationContextType {
  unreadBookingsCount: number;
  setUnreadBookingsCount: (count: number) => void;
  newBookingNotification: BookingNotification | null;
  setNewBookingNotification: (notification: BookingNotification | null) => void;
}

const BookingNotificationContext = createContext<BookingNotificationContextType | undefined>(undefined);

export function BookingNotificationProvider({ children }: { children: ReactNode }) {
  const [unreadBookingsCount, setUnreadBookingsCount] = useState(0);
  const [newBookingNotification, setNewBookingNotification] = useState<BookingNotification | null>(null);

  return (
    <BookingNotificationContext.Provider
      value={{
        unreadBookingsCount,
        setUnreadBookingsCount,
        newBookingNotification,
        setNewBookingNotification,
      }}
    >
      {children}
    </BookingNotificationContext.Provider>
  );
}

export function useBookingNotifications() {
  const context = useContext(BookingNotificationContext);
  if (context === undefined) {
    throw new Error('useBookingNotifications must be used within a BookingNotificationProvider');
  }
  return context;
}

