// apps/dashboard/app/timeslots/page.tsx

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';

interface Timeslot {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  shop_id: string;
}

interface Shop {
  id: string;
  name: string;
}

const TimeslotsPage = () => {
  const { user } = useAuth();
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const headers: HeadersInit = {
          'x-user-id': user.id,
        };

        // Fetch timeslots (filtered by user's shops)
        const timeslotsRes = await fetch(`${apiUrl}/timeslots`, { headers });
        if (timeslotsRes.ok) {
          const timeslotsData = await timeslotsRes.json();
          setTimeslots(Array.isArray(timeslotsData) ? timeslotsData : []);
        }

        // Fetch staff (filtered by user's shops)
        const staffRes = await fetch(`${apiUrl}/staff`, { headers });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(Array.isArray(staffData) ? staffData : []);
        }

        // Fetch all shops
        const shopsRes = await fetch(`${apiUrl}/shops`);
        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          setShops(Array.isArray(shopsData) ? shopsData : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [apiUrl, user]);

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff';
  };

  const getShopName = (shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  const getStaffShopId = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.shop_id || '';
  };

  const filteredTimeslots = timeslots.filter(timeslot => {
    if (selectedStaff && timeslot.staff_id !== selectedStaff) {
      return false;
    }
    if (selectedDate) {
      const selectedDay = new Date(selectedDate).getDay();
      return timeslot.day_of_week === selectedDay;
    }
    return true;
  });

  const groupedByStaff = filteredTimeslots.reduce((acc, timeslot) => {
    const staffId = timeslot.staff_id;
    if (!acc[staffId]) {
      acc[staffId] = [];
    }
    acc[staffId].push(timeslot);
    return acc;
  }, {} as Record<string, Timeslot[]>);

  // Show empty state if user has no shops
  if (user && shops.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Timeslots</h1>
          <p className="text-gray-600">View staff availability and generated timeslots</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Shops Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create or claim a shop before you can view timeslots.
          </p>
          <Link
            href="/shops"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Go to Shops →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Timeslots</h1>
        <p className="text-gray-600">View staff availability and generated timeslots</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="">All Staff</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} - {getShopName(member.shop_id)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Schedule</h2>
            </div>
            <div className="p-6">
              {Object.keys(groupedByStaff).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedByStaff).map(([staffId, slots]) => (
                    <div key={staffId} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {getStaffName(staffId).charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {getStaffName(staffId)}
                          </h3>
                          <p className="text-sm text-gray-500">{getShopName(getStaffShopId(staffId))}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {slots.map(slot => (
                          <div
                            key={slot.id}
                            className="bg-green-50 border border-green-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                {daysOfWeek[slot.day_of_week]}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                Available
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">{slot.start_time}</span>
                              <span className="mx-2">-</span>
                              <span className="font-medium">{slot.end_time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-gray-500 text-lg mb-2">No timeslots found</p>
                  <p className="text-gray-400 text-sm">
                    {selectedStaff || selectedDate
                      ? 'Try adjusting your filters'
                      : 'Create availability for staff members to generate timeslots'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeslotsPage;

