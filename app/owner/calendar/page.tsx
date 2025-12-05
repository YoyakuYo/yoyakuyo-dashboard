// app/owner/calendar/page.tsx
// Calendar view page

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const router = useRouter();
  
  // Redirect to bookings page for now
  React.useEffect(() => {
    router.push('/bookings');
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-gray-600">Redirecting to bookings...</p>
    </div>
  );
}

