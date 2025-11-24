// apps/dashboard/app/book/[shopId]/confirm/page.tsx

"use client";
import React from 'react';
import { useParams } from 'next/navigation';

export default function ConfirmPage() {
  const params = useParams();
  const shopId = params?.shopId as string;
  return (
    <div>
      <h1>Confirm Booking</h1>
      <p>Shop ID: {shopId}</p>
      {/* Confirmation form will go here */}
    </div>
  );
}
