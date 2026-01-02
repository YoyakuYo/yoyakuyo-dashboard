// apps/dashboard/app/book/[shopId]/staff/page.tsx

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

export default function StaffPage() {
  const params = useParams();
  const shopId = params?.shopId as string;
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}/staff`);
        if (res.ok) {
          const data = await res.json();
          setStaffMembers(Array.isArray(data) ? data : []);
        } else {
          console.error("Failed to fetch staff:", res.status, res.statusText);
          setStaffMembers([]);
        }
      } catch (error) {
        console.error("Failed to fetch staff:", error);
        setStaffMembers([]);
      }
    };

    fetchStaff();
  }, [shopId, apiUrl]);

    const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStaff(e.target.value);
    };

    const goToNextStep = () => {
        if (selectedStaff && serviceId) {
            router.push(`/book/${shopId}/date?serviceId=${serviceId}&staffId=${selectedStaff}`);
        }
    };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Choose Staff</h1>
      <p>Shop ID: {shopId}</p>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Select a staff member</h2>
        <select value={selectedStaff || ''} onChange={handleStaffChange} className="border rounded p-2">
          <option value="">Select a staff member</option>
          {staffMembers.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.first_name} {staff.last_name}
            </option>
          ))}
        </select>
      </div>

         <button
                onClick={goToNextStep}
                disabled={!selectedStaff}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 disabled:opacity-50"
            >
                Choose Date
            </button>
    </div>
  );
}
