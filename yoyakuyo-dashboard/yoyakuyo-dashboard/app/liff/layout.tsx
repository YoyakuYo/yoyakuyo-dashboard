// LIFF-only layout - separate from web app
// This ensures no shared layout with dashboard/admin

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

