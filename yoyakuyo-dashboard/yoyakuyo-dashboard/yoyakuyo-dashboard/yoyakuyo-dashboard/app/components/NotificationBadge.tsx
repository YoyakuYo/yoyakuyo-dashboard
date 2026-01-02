// app/components/NotificationBadge.tsx
// Generic numeric notification badge used for bookings/reviews counts

"use client";

import React from "react";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  ariaLabelPrefix?: string;
}

export default function NotificationBadge({
  count,
  className = "",
  ariaLabelPrefix = "You have",
}: NotificationBadgeProps) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold ${className}`}
      aria-label={`${ariaLabelPrefix} ${count} pending items`}
    >
      {count}
    </span>
  );
}


