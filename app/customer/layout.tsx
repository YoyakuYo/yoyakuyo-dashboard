"use client";

import { ReactNode } from "react";
import CustomerDashboardLayout from "./components/CustomerDashboardLayout";
import CustomerAuthGuard from "./components/CustomerAuthGuard";
import { CustomerNotificationProvider } from "./components/CustomerNotificationContext";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthGuard>
      <CustomerNotificationProvider>
        <CustomerDashboardLayout>
          {children}
        </CustomerDashboardLayout>
      </CustomerNotificationProvider>
    </CustomerAuthGuard>
  );
}

