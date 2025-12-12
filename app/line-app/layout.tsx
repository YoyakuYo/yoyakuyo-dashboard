// Force dynamic rendering for all LINE app routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LineAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

