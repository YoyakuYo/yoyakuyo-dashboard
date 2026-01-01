// Admin login layout - no guard, just the auth provider
"use client";

import { AdminAuthProvider } from "@/lib/useAdminAuth";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}
