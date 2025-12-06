// app/owner/pricing/page.tsx
// REMOVED - Redirect to services (pricing is part of services)

"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/owner/services');
  }, [router]);

  return null;
}
