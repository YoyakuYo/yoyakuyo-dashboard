// app/owner/services/page.tsx
// Services management page

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function ServicesPage() {
  const router = useRouter();
  
  // Redirect to main shops page for now
  React.useEffect(() => {
    router.push('/shops');
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-gray-600">Redirecting to shop management...</p>
    </div>
  );
}

