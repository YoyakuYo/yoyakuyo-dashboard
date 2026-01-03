// Admin layout with AdminGuard and AdminSidebar
"use client";

import { usePathname } from "next/navigation";
import AdminGuard from "@/app/components/AdminGuard";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Login page should not have sidebar or guard (it handles its own auth)
  if (pathname === "/admin/login" || pathname?.startsWith("/admin/login/")) {
    return <>{children}</>;
  }

  // All other admin pages get the guard and sidebar
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-0 flex flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

