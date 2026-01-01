// Admin layout with AdminGuard and AdminSidebar
"use client";

import AdminGuard from "@/app/components/AdminGuard";
import AdminSidebar from "@/app/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}

