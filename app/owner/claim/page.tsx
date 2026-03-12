// app/owner/claim/page.tsx
// Claim flow removed: redirect to create-shop.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerClaimPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/owner/create-shop");
  }, [router]);
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}
