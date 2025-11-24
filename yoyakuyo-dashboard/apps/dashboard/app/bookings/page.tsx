// apps/dashboard/app/bookings/page.tsx

"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useBookingNotifications } from '../components/BookingNotificationContext';
import BookingCalendar from '../components/BookingCalendar';
import BookingNotificationBar from '../components/BookingNotificationBar';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/apiClient';

interface Booking {
    id: string;
    shop_id: string;
    service_id: string;
    staff_id: string;
    customer_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    date?: string;
    time?: string;
    start_time: string;
    end_time: string;
    notes: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
    shops?: { name: string } | null;
    services?: { name: string } | null;
    staff?: { first_name: string; last_name: string } | null;
}

interface Shop {
    id: string;
    name: string;
}

interface Service {
    id: string;
    name: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
}

interface Timeslot {
    id: string;
    start_time: string;
    end_time: string;
}

const BookingsPage = () => {
    const { user } = useAuth();
    const { setUnreadBookingsCount } = useBookingNotifications();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
    const [newBooking, setNewBooking] = useState({
        shop_id: '',
        service_id: '',
        staff_id: '',
        timeslot_id: '',
        start_time: '',
        end_time: '',
        notes: '',
    });
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editStartTime, setEditStartTime] = useState<string>('');
    const [editEndTime, setEditEndTime] = useState<string>('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [notification, setNotification] = useState<{
      id: string;
      customerName: string;
      serviceName?: string;
      date: string;
      time: string;
      isAICreated: boolean;
    } | null>(null);
    const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Reset unread count when page loads
    useEffect(() => {
        setUnreadBookingsCount(0);
    }, [setUnreadBookingsCount]);

    // Subscribe to ALL new bookings (not just AI-created)
    useEffect(() => {
        if (!user?.id || shops.length === 0) return;

        const supabase = getSupabaseClient();
        const ownerShopIds = shops.map(s => s.id);
        
        const channel = supabase
            .channel('booking_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookings',
                    // Remove filter to get ALL bookings, not just AI-created
                },
                async (payload: any) => {
                    const newBooking = payload.new;
                    
                    // Check if booking belongs to owner's shop
                    if (ownerShopIds.includes(newBooking.shop_id)) {
                        // Fetch booking details
                        try {
                            const res = await fetch(`${apiUrl}/bookings/${newBooking.id}`, {
                                headers: {
                                    'x-user-id': user.id,
                                },
                            });
                            if (res.ok) {
                                const bookingData = await res.json();
                                const startTime = new Date(bookingData.start_time);
                                
                                setNotification({
                                    id: bookingData.id,
                                    customerName: bookingData.customer_name || 'Customer',
                                    serviceName: bookingData.services?.name,
                                    date: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                    time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                    isAICreated: bookingData.created_by_ai || false,
                                });
                                
                                // Refresh bookings list
                                try {
                                    const bookingsRes = await fetch(`${apiUrl}/bookings`, {
                                        headers: {
                                            'x-user-id': user.id,
                                        },
                                    });
                                    if (bookingsRes.ok) {
                                        const bookingsData = await bookingsRes.json();
                                        if (Array.isArray(bookingsData)) {
                                            setBookings(bookingsData);
                                        }
                                    }
                                } catch (error: any) {
                                    // Silently handle connection errors (API server not running)
                                    if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                                        console.error('Error refreshing bookings:', error);
                                    }
                                }
                            }
                        } catch (error: any) {
                            // Silently handle connection errors (API server not running)
                            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                                console.error('Error fetching new booking:', error);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, shops, apiUrl]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!openDropdown) return;
        
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            const dropdownElement = dropdownRefs.current[openDropdown];
            if (dropdownElement && !dropdownElement.contains(target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    useEffect(() => {
        if (!user) return;

        const fetchAll = async () => {
            try {
                const headers: HeadersInit = {
                    'x-user-id': user.id,
                };

                // Fetch all shops
                const shopsRes = await fetch(`${apiUrl}/shops`);
                if (shopsRes.ok) {
                    const shopsData = await shopsRes.json();
                    setShops(Array.isArray(shopsData) ? shopsData : []);
                } else {
                    console.error("Failed to fetch shops:", shopsRes.status, shopsRes.statusText);
                    setShops([]);
                }

                // Fetch services (filtered by user's shops)
                const servicesRes = await fetch(`${apiUrl}/services`, { headers });
                if (servicesRes.ok) {
                    const servicesData = await servicesRes.json();
                    setServices(Array.isArray(servicesData) ? servicesData : []);
                } else {
                    console.error("Failed to fetch services:", servicesRes.status, servicesRes.statusText);
                    setServices([]);
                }

                // Fetch staff (filtered by user's shops)
                const staffRes = await fetch(`${apiUrl}/staff`, { headers });
                if (staffRes.ok) {
                    const staffData = await staffRes.json();
                    setStaffMembers(Array.isArray(staffData) ? staffData : []);
                } else {
                    console.error("Failed to fetch staff:", staffRes.status, staffRes.statusText);
                    setStaffMembers([]);
                }

                // Fetch timeslots (filtered by user's shops)
                try {
                    const timeslotsRes = await fetch(`${apiUrl}/timeslots`, { headers });
                    if (timeslotsRes.ok) {
                        const timeslotsData = await timeslotsRes.json();
                        setTimeslots(Array.isArray(timeslotsData) ? timeslotsData : []);
                    } else {
                        console.error("Failed to fetch timeslots:", timeslotsRes.status, timeslotsRes.statusText);
                        setTimeslots([]);
                    }
                } catch (timeslotError) {
                    console.error("Error fetching timeslots:", timeslotError);
                    setTimeslots([]);
                }

                // Fetch bookings (filtered by user's shops)
                try {
                    const bookingsRes = await fetch(`${apiUrl}/bookings`, { headers });
                    if (bookingsRes.ok) {
                        const bookingsData = await bookingsRes.json();
                        // Double-check that data is an array before setting state
                        if (Array.isArray(bookingsData)) {
                            setBookings(bookingsData);
                        } else {
                            console.error("Bookings data is not an array:", typeof bookingsData, bookingsData);
                            setBookings([]);
                        }
                    } else {
                        console.error("Failed to fetch bookings:", bookingsRes.status, bookingsRes.statusText);
                        // Try to get error message from response
                        try {
                            const errorData = await bookingsRes.json();
                            console.error("Error details:", errorData);
                        } catch (e) {
                            // Ignore JSON parse errors
                        }
                        setBookings([]);
                    }
                } catch (bookingError) {
                    console.error("Error fetching bookings:", bookingError);
                    setBookings([]);
                }
            } catch (error: any) {
                // Silently handle connection errors (API server not running)
                if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                    console.error("Failed to fetch data:", error);
                }
                // Ensure all states are arrays even on error
                setShops([]);
                setServices([]);
                setStaffMembers([]);
                setTimeslots([]);
                setBookings([]);
            }
        };

        fetchAll();
    }, [apiUrl, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBooking(prev => ({ ...prev, [name]: value }));
    };

    // Filter bookings by selected date if set
    const filteredBookings = useMemo(() => {
        let filtered = bookings;
        
        // Filter by selected date if set
        if (selectedDate) {
            const selectedDateStr = selectedDate.toISOString().split('T')[0];
            filtered = filtered.filter(booking => {
                if (!booking.start_time) return false;
                const bookingDate = new Date(booking.start_time);
                const bookingDateStr = bookingDate.toISOString().split('T')[0];
                return bookingDateStr === selectedDateStr;
            });
        }
        
        return filtered;
    }, [bookings, selectedDate]);

    const refreshBookings = async () => {
        if (!user?.id) return;
        try {
            const bookingsRes = await fetch(`${apiUrl}/bookings`, {
                headers: {
                    'x-user-id': user.id,
                },
            });
            if (bookingsRes.ok) {
                const bookingsData = await bookingsRes.json();
                if (Array.isArray(bookingsData)) {
                    setBookings(bookingsData);
                    const pendingCount = bookingsData.filter((b: Booking) => b.status === 'pending').length;
                    setUnreadBookingsCount(pendingCount);
                }
            }
        } catch (error: any) {
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error refreshing bookings:', error);
            }
        }
    };

    const confirmBooking = async (bookingId: string) => {
        if (!user?.id) return;
        setUpdatingStatus(bookingId);
        try {
            const res = await fetch(`${apiUrl}/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id,
                },
                body: JSON.stringify({ status: 'confirmed' }),
            });

            if (res.ok) {
                await refreshBookings();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(errorData.error || 'Failed to confirm booking');
            }
        } catch (error: any) {
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error confirming booking:', error);
                alert('Failed to confirm booking');
            }
        } finally {
            setUpdatingStatus(null);
        }
    };

    const cancelBooking = async (bookingId: string) => {
        if (!user?.id) return;
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        setUpdatingStatus(bookingId);
        try {
            const res = await fetch(`${apiUrl}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': user.id,
                },
            });

            if (res.ok) {
                await refreshBookings();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(errorData.error || 'Failed to cancel booking');
            }
        } catch (error: any) {
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error canceling booking:', error);
                alert('Failed to cancel booking');
            }
        } finally {
            setUpdatingStatus(null);
        }
    };

    const openEditModal = (booking: Booking) => {
        setEditingBooking(booking);
        // Convert ISO strings to datetime-local format
        const startDateTime = booking.start_time ? new Date(booking.start_time).toISOString().slice(0, 16) : '';
        const endDateTime = booking.end_time ? new Date(booking.end_time).toISOString().slice(0, 16) : '';
        setEditStartTime(startDateTime);
        setEditEndTime(endDateTime);
        setShowEditModal(true);
    };

    const saveReschedule = async () => {
        if (!user?.id || !editingBooking) return;
        
        if (!editStartTime || !editEndTime) {
            alert('Please provide both start and end times');
            return;
        }

        setUpdatingStatus(editingBooking.id);
        try {
            const res = await fetch(`${apiUrl}/bookings/${editingBooking.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id,
                },
                body: JSON.stringify({
                    start_time: new Date(editStartTime).toISOString(),
                    end_time: new Date(editEndTime).toISOString(),
                }),
            });

            if (res.ok) {
                await refreshBookings();
                setShowEditModal(false);
                setEditingBooking(null);
                setEditStartTime('');
                setEditEndTime('');
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(errorData.error || 'Failed to reschedule booking');
            }
        } catch (error: any) {
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error('Error rescheduling booking:', error);
                alert('Failed to reschedule booking');
            }
        } finally {
            setUpdatingStatus(null);
        }
    };

    const createBooking = async () => {
        try {
            const res = await fetch(`${apiUrl}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newBooking),
            });

            if (res.ok) {
                // Refresh bookings after creation
                try {
                    const bookingsRes = await fetch(`${apiUrl}/bookings`);
                    if (bookingsRes.ok) {
                        const bookingsData = await bookingsRes.json();
                        // Double-check that data is an array before setting state
                        if (Array.isArray(bookingsData)) {
                            setBookings(bookingsData);
                        } else {
                            console.error("Bookings data is not an array:", typeof bookingsData, bookingsData);
                            setBookings([]);
                        }
                    } else {
                        console.error("Failed to refresh bookings:", bookingsRes.status, bookingsRes.statusText);
                        setBookings([]);
                    }
                } catch (refreshError: any) {
                    // Silently handle connection errors (API server not running)
                    if (!refreshError?.message?.includes('Failed to fetch') && !refreshError?.message?.includes('ERR_CONNECTION_REFUSED')) {
                        console.error("Error refreshing bookings:", refreshError);
                    }
                    setBookings([]);
                }
                setNewBooking({
                    shop_id: '',
                    service_id: '',
                    staff_id: '',
                    timeslot_id: '',
                    start_time: '',
                    end_time: '',
                    notes: '',
                });
            } else {
                console.error("Failed to create booking:", res.status, res.statusText);
            }
        } catch (error: any) {
            // Silently handle connection errors (API server not running)
            if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
                console.error("Failed to create booking:", error);
            }
        }
    };

    // Show empty state if user has no shops
    if (user && shops.length === 0) {
        return (
            <div className="p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Bookings</h1>
                    <p className="text-gray-600">View and manage all bookings</p>
                </div>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
                    <div className="text-6xl mb-4">🏪</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Shops Found</h2>
                    <p className="text-gray-600 mb-6">
                        You need to create or claim a shop before you can view bookings.
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
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bookings</h1>
                        <p className="text-gray-600">View and manage all bookings</p>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            📋 List View
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                viewMode === 'calendar'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            📅 Calendar View
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Bar */}
            <BookingNotificationBar
                notification={notification}
                onDismiss={() => setNotification(null)}
                onViewBooking={(bookingId) => {
                    setNotification(null);
                    // Scroll to booking or switch to list view
                    setViewMode('list');
                    setTimeout(() => {
                        const bookingElement = document.getElementById(`booking-${bookingId}`);
                        if (bookingElement) {
                            bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 100);
                }}
            />

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <div className="mb-6">
                    <BookingCalendar
                        bookings={bookings}
                        onDateClick={(date) => {
                            setSelectedDate(date);
                            setViewMode('list'); // Switch to list view to show filtered bookings
                        }}
                        selectedDate={selectedDate}
                        shopId={shops.length > 0 ? shops[0].id : undefined}
                    />
                </div>
            )}

            {/* Filter by selected date if calendar date was clicked */}
            {selectedDate && viewMode === 'list' && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Showing bookings for:</span>
                    <span className="text-sm font-semibold text-gray-900">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => setSelectedDate(null)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {/* Bookings Grid - Beautiful Card Layout */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-xl font-bold text-gray-800">
                        All Bookings ({filteredBookings.length})
                    </h2>
                </div>
                <div className="p-6">
                    {Array.isArray(filteredBookings) && filteredBookings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBookings.map(booking => {
                                try {
                                    const startTime = booking.start_time ? new Date(booking.start_time) : null;
                                    const endTime = booking.end_time ? new Date(booking.end_time) : null;
                                    const isUpdating = updatingStatus === booking.id;
                                    const canReschedule = booking.status !== 'cancelled' && booking.status !== 'completed';
                                    const canCancel = booking.status !== 'cancelled' && booking.status !== 'completed';
                                    const canConfirm = booking.status === 'pending';

                                    const getStatusBadge = (status: string) => {
                                        const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1";
                                        switch (status) {
                                            case 'pending':
                                                return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}><span className="w-2 h-2 bg-yellow-500 rounded-full"></span>Pending</span>;
                                            case 'confirmed':
                                                return <span className={`${baseClasses} bg-green-100 text-green-800`}><span className="w-2 h-2 bg-green-500 rounded-full"></span>Confirmed</span>;
                                            case 'rejected':
                                                return <span className={`${baseClasses} bg-red-100 text-red-800`}><span className="w-2 h-2 bg-red-500 rounded-full"></span>Declined</span>;
                                            case 'cancelled':
                                                return <span className={`${baseClasses} bg-gray-100 text-gray-800`}><span className="w-2 h-2 bg-gray-500 rounded-full"></span>Cancelled</span>;
                                            case 'completed':
                                                return <span className={`${baseClasses} bg-blue-100 text-blue-800`}><span className="w-2 h-2 bg-blue-500 rounded-full"></span>Completed</span>;
                                            default:
                                                return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
                                        }
                                    };

                                    return (
                                        <div 
                                            id={`booking-${booking.id}`}
                                            key={booking.id || Math.random()} 
                                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                        >
                                            {/* Card Header */}
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                                                            {booking.customer_name || 'Unknown Customer'}
                                                        </h3>
                                                        {booking.services?.name && (
                                                            <p className="text-sm text-gray-600 font-medium">
                                                                {booking.services.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="px-5 py-4 space-y-3">
                                                {/* Date & Time */}
                                                {startTime && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                            </div>
                                                            <div className="text-gray-600">
                                                                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Staff */}
                                                {booking.staff && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span>{booking.staff.first_name} {booking.staff.last_name}</span>
                                                    </div>
                                                )}

                                                {/* Contact Info */}
                                                <div className="pt-2 border-t border-gray-100 space-y-1">
                                                    {booking.customer_email && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="truncate">{booking.customer_email}</span>
                                                        </div>
                                                    )}
                                                    {booking.customer_phone && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span>{booking.customer_phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Footer - Action Buttons */}
                                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                                                <div className="flex gap-2">
                                                    {canReschedule && (
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdown(null);
                                                                openEditModal(booking);
                                                            }}
                                                            disabled={isUpdating}
                                                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            Reschedule
                                                        </button>
                                                    )}
                                                    {canConfirm && (
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdown(null);
                                                                confirmBooking(booking.id);
                                                            }}
                                                            disabled={isUpdating}
                                                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {canCancel && (
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdown(null);
                                                                cancelBooking(booking.id);
                                                            }}
                                                            disabled={isUpdating}
                                                            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (e) {
                                    console.error("Error rendering booking card:", e, booking);
                                    return null;
                                }
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <p className="text-gray-500 text-lg font-medium">
                                {bookings.length === 0 
                                    ? 'No bookings found' 
                                    : 'No bookings match your filters'}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                {bookings.length === 0
                                    ? 'Bookings will appear here once customers make appointments'
                                    : 'Try adjusting your filters'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit/Reschedule Modal */}
            {showEditModal && editingBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit / Reschedule Booking</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={saveReschedule}
                                disabled={updatingStatus === editingBooking.id}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {updatingStatus === editingBooking.id ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingBooking(null);
                                    setEditStartTime('');
                                    setEditEndTime('');
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingsPage;
