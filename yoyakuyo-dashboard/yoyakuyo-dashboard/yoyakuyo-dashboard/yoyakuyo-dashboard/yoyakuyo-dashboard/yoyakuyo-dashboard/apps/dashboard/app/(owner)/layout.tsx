// apps/dashboard/app/(owner)/layout.tsx
// Owner layout with sidebar (for authenticated owners only)



"use client";
import { usePathname } from 'next/navigation';
import AuthGuard from '../components/AuthGuard';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Header />
      <Sidebar />
      <main className="lg:ml-64 pt-16 min-h-screen bg-gray-50">
        {children}
      </main>
    </AuthGuard>
  );
}

