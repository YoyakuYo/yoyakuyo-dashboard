// app/owner/reviews/page.tsx
// Owner reviews page - redirects to shop profile reviews tab

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerReviewsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to shop profile with reviews tab
    router.push('/owner/shop-profile?tab=reviews');
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-gray-600">Redirecting to reviews...</p>
    </div>
  );
}

