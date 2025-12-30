// apps/dashboard/app/(owner)/layout.tsx
// Pass-through layout: the global DashboardLayout already provides
// Header, Sidebar, and AuthGuard for owner routes.

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


