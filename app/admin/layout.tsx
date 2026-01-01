// Admin layout with AdminAuthProvider, AdminGuard and AdminSidebar
// Login page bypasses this layout (has its own)
"use client";

import { usePathname } from "next/navigation";
import { AdminAuthProvider } from "@/lib/useAdminAuth";
import AdminGuard from "@/app/components/AdminGuard";
import AdminSidebar from "@/app/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't apply guard/layout to login page
  if (pathname === "/admin/login") {
    return <AdminAuthProvider>{children}</AdminAuthProvider>;
  }

  return (
    <AdminAuthProvider>
      <AdminGuard>
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <main className="flex-1 lg:ml-0">
            <div className="p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </AdminGuard>
    </AdminAuthProvider>
  );
}

