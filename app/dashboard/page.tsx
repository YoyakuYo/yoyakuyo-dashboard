"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { shopsApi, bookingsApi, servicesApi } from "@/lib/api";
import Link from "next/link";

interface Shop {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
}

interface Booking {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  date?: string | null;
  time_slot?: string | null;
  status?: string | null;
  services?: { name: string } | null;
}

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  duration_minutes?: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Check authentication
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
      loadShops();
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadShops = async () => {
    setLoadingShops(true);
    try {
      // Don't specify limit to fetch all shops (backend will batch fetch)
      const response = await shopsApi.getAll() as { data?: Shop[]; count?: number; page?: number; limit?: number; pagination?: { total: number; totalPages: number } } | Shop[];
      if (Array.isArray(response)) {
        setShops(response);
      } else if (response?.data) {
        // Handle paginated response: { data: [...], pagination: {...} }
        const shopsData = Array.isArray(response.data) 
          ? response.data 
          : [];
        setShops(shopsData);
        console.log(`Loaded ${shopsData.length} shops (total: ${response.pagination?.total || shopsData.length})`);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error("Error loading shops:", error);
      setShops([]);
    } finally {
      setLoadingShops(false);
    }
  };

  const loadBookings = async (shopId: string) => {
    setLoadingBookings(true);
    try {
      const response = await bookingsApi.getByShopId(shopId) as { data?: Booking[] } | Booking[];
      if (Array.isArray(response)) {
        setBookings(response);
      } else if (response?.data) {
        setBookings(Array.isArray(response.data) ? response.data : []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadServices = async (shopId: string) => {
    setLoadingServices(true);
    try {
      const response = await servicesApi.getByShopId(shopId) as { data?: Service[] } | Service[];
      if (Array.isArray(response)) {
        setServices(response);
      } else if (response?.data) {
        setServices(Array.isArray(response.data) ? response.data : []);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    if (shopId) {
      loadBookings(shopId);
      loadServices(shopId);
    } else {
      setBookings([]);
      setServices([]);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">YoyakuYo</h1>
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-700 bg-blue-50 rounded-lg font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Shops
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Bookings
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Settings
          </Link>
        </nav>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome back, {user?.email}!
          </h1>

          {/* Shop Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label htmlFor="shop-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Shop
            </label>
            <select
              id="shop-select"
              value={selectedShopId}
              onChange={(e) => handleShopChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingShops}
            >
              <option value="">-- Select a shop --</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} {shop.city ? `(${shop.city})` : ""}
                </option>
              ))}
            </select>
            {loadingShops && (
              <p className="mt-2 text-sm text-gray-500">Loading shops...</p>
            )}
          </div>

          {selectedShopId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bookings</h2>
                {loadingBookings ? (
                  <p className="text-gray-500">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-gray-500">No bookings found for this shop.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date/Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {booking.customer_name || booking.customer_email || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {booking.date} {booking.time_slot ? `@ ${booking.time_slot}` : ""}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  booking.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : booking.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {booking.status || "pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Services Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
                {loadingServices ? (
                  <p className="text-gray-500">Loading services...</p>
                ) : services.length === 0 ? (
                  <p className="text-gray-500">No services found for this shop.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{service.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {service.price ? `¥${service.price}` : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {service.duration_minutes ? `${service.duration_minutes} min` : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedShopId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <p className="text-gray-500">Select a shop to view bookings and services.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

