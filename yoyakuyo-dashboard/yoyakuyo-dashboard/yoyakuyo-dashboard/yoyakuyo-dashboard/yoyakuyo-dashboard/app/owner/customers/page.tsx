// app/owner/customers/page.tsx
// Owner customers page - list of customers who have booked or messaged

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  booking_count: number;
  last_booking_date?: string;
}

export default function OwnerCustomersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadCustomers();
    }
  }, [user, authLoading, router]);

  const loadCustomers = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get owner's shop
      const shopsRes = await fetch(`${apiUrl}/api/owner/shops`, {
        headers: { 'x-user-id': user.id },
      });
      if (!shopsRes.ok) {
        setCustomers([]);
        return;
      }
      const shopsData = await shopsRes.json();
      const shops = shopsData.shops || [];

      if (shops.length === 0) {
        setCustomers([]);
        return;
      }

      const shopId = shops[0].id;

      // Get bookings to extract customers
      const bookingsRes = await fetch(`${apiUrl}/api/bookings?shop_id=${shopId}`, {
        headers: { 'x-user-id': user.id },
      });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const bookings = bookingsData.bookings || [];

        // Group by customer
        const customerMap = new Map<string, Customer>();
        bookings.forEach((booking: any) => {
          const customerId = booking.customer_profile_id || booking.customer_email || 'unknown';
          if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
              id: customerId,
              email: booking.customer_email || 'N/A',
              full_name: booking.customer_name,
              phone: booking.customer_phone,
              booking_count: 0,
            });
          }
          const customer = customerMap.get(customerId)!;
          customer.booking_count++;
          if (!customer.last_booking_date || booking.booking_date > customer.last_booking_date) {
            customer.last_booking_date = booking.booking_date;
          }
        });

        setCustomers(Array.from(customerMap.values()));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Customers</h1>

      {customers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Booking
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.booking_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.last_booking_date
                      ? new Date(customer.last_booking_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No customers yet</p>
        </div>
      )}
    </div>
  );
}

