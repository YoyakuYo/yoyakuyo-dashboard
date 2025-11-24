// apps/dashboard/app/(public)/layout.tsx
// Public layout for routes inside (public) folder
// Note: Routes outside this folder that are public will use PublicLayoutWrapper from DashboardLayout

"use client";

// This layout is a pass-through since PublicLayoutWrapper handles the header
// Routes inside (public) folder will get the header from PublicLayoutWrapper in DashboardLayout
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just pass through - PublicLayoutWrapper in DashboardLayout handles the header
  return <>{children}</>;
}

