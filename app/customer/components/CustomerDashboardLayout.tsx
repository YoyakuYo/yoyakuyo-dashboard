"use client";

import { ReactNode } from "react";
import CustomerHeader from "./CustomerHeader";
import CustomerSidebar from "./CustomerSidebar";

export default function CustomerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader />
      <CustomerSidebar />
      <main className="lg:ml-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}

