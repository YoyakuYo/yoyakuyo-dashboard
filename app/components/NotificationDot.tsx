// app/components/NotificationDot.tsx
// Small red dot indicator for pending bookings

"use client";

import React from 'react';

interface NotificationDotProps {
  className?: string;
}

export default function NotificationDot({ className = "" }: NotificationDotProps) {
  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full bg-red-500 ${className}`}
      aria-label="Pending bookings"
    />
  );
}

