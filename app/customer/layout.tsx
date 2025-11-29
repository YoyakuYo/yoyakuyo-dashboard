"use client";

import { ReactNode } from "react";
import CustomerDashboardLayout from "./components/CustomerDashboardLayout";
import CustomerAuthGuard from "./components/CustomerAuthGuard";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthGuard>
      <CustomerDashboardLayout>
        {children}
      </CustomerDashboardLayout>
    </CustomerAuthGuard>
  );
}

