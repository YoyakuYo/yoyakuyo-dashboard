// apps/dashboard/app/book/[shopId]/timeslot/page.tsx

"use client";
import React from 'react';
import { useParams } from 'next/navigation';

export default function TimeslotPage() {
  const params = useParams();
  const shopId = params?.shopId as string;
  return (
    <div>
      <h1>Choose Timeslot</h1>
      <p>Shop ID: {shopId}</p>
      {/* Timeslot selection will go here */}
    </div>
  );
}
