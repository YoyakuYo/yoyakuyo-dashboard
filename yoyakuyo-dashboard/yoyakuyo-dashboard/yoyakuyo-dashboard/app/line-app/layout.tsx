// LINE App layout - separate from web app
// This ensures no shared layout with dashboard/admin

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import LineAppShell from "./LineAppShell";

export default function LineAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LineAppShell>{children}</LineAppShell>;
}
