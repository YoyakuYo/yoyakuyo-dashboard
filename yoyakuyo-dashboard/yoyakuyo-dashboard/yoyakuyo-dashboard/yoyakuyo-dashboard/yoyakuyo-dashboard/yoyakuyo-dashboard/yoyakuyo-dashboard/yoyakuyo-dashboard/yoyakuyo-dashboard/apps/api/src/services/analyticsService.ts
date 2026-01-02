// apps/api/src/services/analyticsService.ts
// Analytics service for shop owners

import { supabaseAdmin, supabase } from '../lib/supabase';

const dbClient = supabaseAdmin || supabase;

export interface ShopOverview {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  pendingBookings: number;
  averageBookingsPerDay: number;
  cancellationRate: number;
  totalRevenue: number;
  averageRevenuePerDay: number;
}

export interface BookingTrend {
  date: string;
  count: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

export interface ServicePopularity {
  serviceId: string;
  serviceName: string;
  bookingCount: number;
  revenue: number;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  bookingCount: number;
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    bookingCount: number;
  }>;
}

export interface PeakHours {
  hour: number;
  bookingCount: number;
}

/**
 * Get shop overview statistics
 */
export async function getShopOverview(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<ShopOverview> {
  try {
    const { data: bookings, error } = await dbClient
      .from('bookings')
      .select('status, start_time, services(price)')
      .eq('shop_id', shopId)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (error) {
      throw error;
    }

    const totalBookings = bookings?.length || 0;
    const confirmedBookings =
      bookings?.filter((b) => b.status === 'confirmed').length || 0;
    const cancelledBookings =
      bookings?.filter((b) => b.status === 'cancelled').length || 0;
    const completedBookings =
      bookings?.filter((b) => b.status === 'completed').length || 0;
    const pendingBookings =
      bookings?.filter((b) => b.status === 'pending').length || 0;

    const daysDiff =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);
    const days = Math.max(1, daysDiff);

    const averageBookingsPerDay = totalBookings / days;
    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Calculate revenue (sum of service prices for completed bookings)
    const totalRevenue =
      bookings
        ?.filter((b) => b.status === 'completed' || b.status === 'confirmed')
        .reduce((sum, b) => {
          const price = (b.services as any)?.price || 0;
          return sum + price;
        }, 0) || 0;

    const averageRevenuePerDay = totalRevenue / days;

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      pendingBookings,
      averageBookingsPerDay: Math.round(averageBookingsPerDay * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      totalRevenue,
      averageRevenuePerDay: Math.round(averageRevenuePerDay * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting shop overview:', error);
    throw error;
  }
}

/**
 * Get booking trends over time
 */
export async function getBookingTrends(
  shopId: string,
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<BookingTrend[]> {
  try {
    const { data: bookings, error } = await dbClient
      .from('bookings')
      .select('status, start_time')
      .eq('shop_id', shopId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    // Group bookings by date
    const grouped: Record<string, BookingTrend> = {};

    bookings?.forEach((booking) => {
      const date = new Date(booking.start_time);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          count: 0,
          confirmed: 0,
          cancelled: 0,
          completed: 0,
        };
      }

      grouped[key].count++;
      if (booking.status === 'confirmed') grouped[key].confirmed++;
      if (booking.status === 'cancelled') grouped[key].cancelled++;
      if (booking.status === 'completed') grouped[key].completed++;
    });

    return Object.values(grouped).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  } catch (error) {
    console.error('Error getting booking trends:', error);
    throw error;
  }
}

/**
 * Get service popularity
 */
export async function getServicePopularity(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<ServicePopularity[]> {
  try {
    const { data: bookings, error } = await dbClient
      .from('bookings')
      .select('service_id, services(id, name, price), status')
      .eq('shop_id', shopId)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (error) {
      throw error;
    }

    const serviceMap: Record<string, ServicePopularity> = {};

    bookings?.forEach((booking) => {
      const service = booking.services as any;
      if (!service || !service.id) return;

      const serviceId = service.id;
      if (!serviceMap[serviceId]) {
        serviceMap[serviceId] = {
          serviceId,
          serviceName: service.name || 'Unknown',
          bookingCount: 0,
          revenue: 0,
        };
      }

      serviceMap[serviceId].bookingCount++;
      if (
        booking.status === 'completed' ||
        booking.status === 'confirmed'
      ) {
        serviceMap[serviceId].revenue += service.price || 0;
      }
    });

    return Object.values(serviceMap).sort(
      (a, b) => b.bookingCount - a.bookingCount
    );
  } catch (error) {
    console.error('Error getting service popularity:', error);
    throw error;
  }
}

/**
 * Get staff performance
 */
export async function getStaffPerformance(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<StaffPerformance[]> {
  try {
    const { data: bookings, error } = await dbClient
      .from('bookings')
      .select('staff_id, staff(first_name, last_name)')
      .eq('shop_id', shopId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .not('staff_id', 'is', null);

    if (error) {
      throw error;
    }

    const staffMap: Record<string, StaffPerformance> = {};

    bookings?.forEach((booking) => {
      const staff = booking.staff as any;
      if (!staff || !booking.staff_id) return;

      const staffId = booking.staff_id;
      if (!staffMap[staffId]) {
        staffMap[staffId] = {
          staffId,
          staffName: `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
          bookingCount: 0,
        };
      }

      staffMap[staffId].bookingCount++;
    });

    return Object.values(staffMap).sort(
      (a, b) => b.bookingCount - a.bookingCount
    );
  } catch (error) {
    console.error('Error getting staff performance:', error);
    throw error;
  }
}

/**
 * Get customer analytics
 */
export async function getCustomerAnalytics(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<CustomerAnalytics> {
  try {
    const { data: bookings, error } = await dbClient
      .from('bookings')
      .select('customer_id, customer_name, start_time')
      .eq('shop_id', shopId)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (error) {
      throw error;
    }

    // Get all bookings for this shop (to determine returning customers)
    const { data: allBookings } = await dbClient
      .from('bookings')
      .select('customer_id, start_time')
      .eq('shop_id', shopId)
      .lt('start_time', startDate);

    const customerFirstBooking: Record<string, string> = {};
    allBookings?.forEach((b) => {
      if (b.customer_id && !customerFirstBooking[b.customer_id]) {
        customerFirstBooking[b.customer_id] = b.start_time;
      }
    });

    const customerCounts: Record<string, number> = {};
    let newCustomers = 0;
    let returningCustomers = 0;

    bookings?.forEach((booking) => {
      if (booking.customer_id) {
        if (!customerCounts[booking.customer_id]) {
          customerCounts[booking.customer_id] = 0;
          // Check if this is their first booking
          if (
            !customerFirstBooking[booking.customer_id] ||
            booking.start_time < customerFirstBooking[booking.customer_id]
          ) {
            newCustomers++;
          } else {
            returningCustomers++;
          }
        }
        customerCounts[booking.customer_id]++;
      }
    });

    const topCustomers = Object.entries(customerCounts)
      .map(([customerId, count]) => {
        const booking = bookings?.find((b) => b.customer_id === customerId);
        return {
          customerId,
          customerName: booking?.customer_name || 'Unknown',
          bookingCount: count,
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10);

    return {
      newCustomers,
      returningCustomers,
      topCustomers,
    };
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    throw error;
  }
}

/**
 * Get peak booking hours
 */
export async function getPeakHours(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<PeakHours[]> {
  try {
    const { data: bookings, error } = await dbClient
      .from('bookings')
      .select('start_time')
      .eq('shop_id', shopId)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (error) {
      throw error;
    }

    const hourCounts: Record<number, number> = {};

    bookings?.forEach((booking) => {
      const date = new Date(booking.start_time);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      bookingCount: hourCounts[i] || 0,
    }));
  } catch (error) {
    console.error('Error getting peak hours:', error);
    throw error;
  }
}

/**
 * Get cancellation rate
 */
export async function getCancellationRate(
  shopId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  try {
    const overview = await getShopOverview(shopId, startDate, endDate);
    return overview.cancellationRate;
  } catch (error) {
    console.error('Error getting cancellation rate:', error);
    throw error;
  }
}

