// apps/dashboard/app/components/BookingCalendar.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { apiUrl } from '@/lib/apiClient';

interface Booking {
  id: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  customer_name?: string;
  services?: { name: string } | null;
}

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
  shopId?: string; // Add shopId prop
}

export default function BookingCalendar({ bookings, onDateClick, selectedDate, shopId }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openingHours, setOpeningHours] = useState<Record<string, { start: string; end: string }> | null>(null);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());

  // Fetch opening hours if shopId is provided
  useEffect(() => {
    if (!shopId) return;
    
    const fetchOpeningHours = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}`);
        if (res.ok) {
          const shop = await res.json();
          if (shop.opening_hours && typeof shop.opening_hours === 'object') {
            setOpeningHours(shop.opening_hours);
          }
        }
      } catch (error) {
        console.error('Error fetching opening hours:', error);
      }
    };

    fetchOpeningHours();
  }, [shopId]);

  // Fetch holidays if shopId is provided
  useEffect(() => {
    if (!shopId) return;
    
    const fetchHolidays = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}/holidays`);
        if (res.ok) {
          const holidaysData = await res.json();
          // Convert to Set of date strings (YYYY-MM-DD) for fast lookup
          const holidayDates = new Set<string>(
            holidaysData.map((h: { date: string }) => h.date)
          );
          setHolidays(holidayDates);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };

    fetchHolidays();
  }, [shopId]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach(booking => {
      if (booking.start_time) {
        const date = new Date(booking.start_time);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(booking);
      }
    });
    return grouped;
  }, [bookings]);

  // Custom tile content to show booking count, holidays, and open days
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateKey = date.toISOString().split('T')[0];
      const dayBookings = bookingsByDate[dateKey] || [];
      const isHoliday = holidays.has(dateKey);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isOpen = openingHours && openingHours[dayName] && !isHoliday;
      
      if (isHoliday || isOpen || dayBookings.length > 0) {
        const pendingCount = dayBookings.filter(b => b.status === 'pending').length;
        const confirmedCount = dayBookings.filter(b => b.status === 'confirmed').length;
        
        return (
          <div className="flex flex-col items-center gap-1 mt-1">
            {isHoliday && (
              <div className="w-2 h-2 bg-red-500 rounded-full" title="Holiday - Shop Closed"></div>
            )}
            {isOpen && !isHoliday && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Shop Open"></div>
            )}
            {pendingCount > 0 && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title={`${pendingCount} pending`}></div>
            )}
            {confirmedCount > 0 && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${confirmedCount} confirmed`}></div>
            )}
            {dayBookings.length > 2 && (
              <span className="text-xs text-gray-600 font-semibold">{dayBookings.length}</span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Custom tile className for styling
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateKey = date.toISOString().split('T')[0];
      const dayBookings = bookingsByDate[dateKey] || [];
      const isHoliday = holidays.has(dateKey);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      const isOpen = openingHours && openingHours[dayName] && !isHoliday;
      
      if (isHoliday) {
        return 'is-holiday';
      }
      
      if (isOpen) {
        return 'is-open';
      }
      
      if (dayBookings.length > 0) {
        return 'has-bookings';
      }
      
      // Highlight selected date
      if (selectedDate && dateKey === selectedDate.toISOString().split('T')[0]) {
        return 'selected-date';
      }
    }
    return null;
  };

  const handleDateChange = (value: any) => {
    if (!value || Array.isArray(value)) return;
    const dateValue = value as Date;
    setCurrentDate(dateValue);
    if (onDateClick) {
      onDateClick(dateValue);
    }
  };

  // Format hours for display
  const formatHours = (dayName: string) => {
    if (!openingHours || !openingHours[dayName]) return null;
    const hours = openingHours[dayName];
    return `${hours.start} - ${hours.end}`;
  };

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayDisplayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Calendar View</h2>
      
      {/* Opening Hours Section */}
      {openingHours && Object.keys(openingHours).length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Opening Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {dayNames.map((dayName, index) => {
              const hours = formatHours(dayName);
              if (!hours) return null;
              return (
                <div key={dayName} className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{dayDisplayNames[index]}:</span>
                  <span className="text-gray-900 font-semibold">{hours}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Calendar
          onChange={handleDateChange}
          value={currentDate}
          tileContent={tileContent}
          tileClassName={tileClassName}
          className="w-full border-0"
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 justify-center text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Holiday (Closed)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Open</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">Confirmed</span>
        </div>
      </div>
      
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          padding: 10px;
          position: relative;
        }
        .react-calendar__tile.has-bookings {
          background-color: #f0f9ff;
        }
        .react-calendar__tile.is-holiday {
          background-color: #fee2e2 !important;
          opacity: 0.7;
        }
        .react-calendar__tile.is-holiday:hover {
          background-color: #fecaca !important;
        }
        .react-calendar__tile.is-open {
          background-color: #dcfce7 !important;
        }
        .react-calendar__tile.is-open:hover {
          background-color: #bbf7d0 !important;
        }
        .react-calendar__tile.selected-date {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        .react-calendar__tile:enabled:hover {
          background-color: #e0f2fe;
        }
        .react-calendar__tile--active {
          background-color: #3b82f6 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}

