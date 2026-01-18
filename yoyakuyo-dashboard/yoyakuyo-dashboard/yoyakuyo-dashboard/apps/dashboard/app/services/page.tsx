// apps/dashboard/app/services/page.tsx

"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';

interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface Shop {
  id: string;
  name: string;
}

const ServicesPage = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    shop_id: '',
    name: '',
    description: '',
    price: 0,
    duration: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const headers: HeadersInit = {
          'x-user-id': user.id,
        };

        // Fetch services (filtered by user's shops)
        const servicesRes = await fetch(`${apiUrl}/services`, { headers });
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }

        // Fetch all shops for dropdown
        const shopsRes = await fetch(`${apiUrl}/shops`);
        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          const shopsArray = Array.isArray(shopsData) ? shopsData : [];
          setShops(shopsArray);
          
          // Auto-select shop if user only has one
          setNewService(prev => {
            if (shopsArray.length === 1 && !prev.shop_id) {
              return { ...prev, shop_id: shopsArray[0].id };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [apiUrl, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    setNewService(prev => ({ ...prev, [name]: processedValue }));
  };

  const createService = async () => {
    if (!user) {
      setError('You must be logged in to create a service');
      return;
    }

    if (!newService.shop_id || !newService.name || !newService.price || !newService.duration) {
      setError('Shop, name, price, and duration are required');
      return;
    }

    setError(null);
    try {
      const res = await fetch(`${apiUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(newService),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && 'id' in data) {
          setServices([...services, data]);
        } else {
          // Re-fetch services list
          const refreshRes = await fetch(`${apiUrl}/services`);
          if (refreshRes.ok) {
            const servicesData = await refreshRes.json();
            setServices(Array.isArray(servicesData) ? servicesData : []);
          }
        }

        setNewService({
          shop_id: '',
          name: '',
          description: '',
          price: 0,
          duration: 0,
        });
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || `Failed to create service: ${res.status}`);
      }
    } catch (error) {
      console.error("Failed to create service:", error);
      setError('Failed to create service. Please try again.');
    }
  };

  const getShopName = (shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

  // Show empty state if user has no shops
  if (user && shops.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Services</h1>
          <p className="text-gray-600">Manage services and pricing</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Shops Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create or claim a shop before you can manage services.
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Services</h1>
        <p className="text-gray-600">Manage services and pricing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Service Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Service</h2>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop *</label>
                <select
                  name="shop_id"
                  value={newService.shop_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                >
                  <option value="">Select Shop</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Service name"
                  value={newService.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Service description"
                  value={newService.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  placeholder="0.00"
                  value={newService.price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  name="duration"
                  placeholder="Duration"
                  value={newService.duration}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  min="1"
                  required
                />
              </div>
              <button
                onClick={createService}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Service
              </button>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">All Services</h2>
            </div>
            <div className="overflow-x-auto">
              {Array.isArray(services) && services.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/shops/services/${service.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            {service.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{getShopName(service.shop_id)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-semibold">${service.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{service.duration} min</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/shops/services/${service.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No services found</p>
                  <p className="text-gray-400 text-sm mt-2">Create your first service to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;

