// apps/dashboard/app/book/[shopId]/date/page.tsx

"use client";
import React from 'react';
import { useParams } from 'next/navigation';

export default function DatePage() {
  const params = useParams();
  const shopId = params?.shopId as string;
  return (
    <div>
      <h1>Choose Date</h1>
      <p>Shop ID: {shopId}</p>
      {/* Date selection will go here */}
    </div>
  );
}
