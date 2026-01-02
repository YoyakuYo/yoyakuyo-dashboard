// app/owner/photos/page.tsx
// Owner photos page - redirects to shop profile photos tab

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerPhotosPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to shop profile with photos tab
    router.push('/owner/shop-profile?tab=photos');
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-gray-600">Redirecting to photos...</p>
    </div>
  );
}

