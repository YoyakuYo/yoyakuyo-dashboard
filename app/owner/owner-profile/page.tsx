// app/owner/owner-profile/page.tsx
// REMOVED - Redirect to dashboard

"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerProfilePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/owner/dashboard');
  }, [router]);

  return null;
}
