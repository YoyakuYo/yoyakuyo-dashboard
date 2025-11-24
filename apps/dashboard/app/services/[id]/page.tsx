// apps/dashboard/app/services/[id]/page.tsx

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';

interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  duration_minutes?: number; // New field from updated schema
}

interface Shop {
  id: string;
  name: string;
}

const ServiceDetailsPage = () => {
  const params = useParams();
  const { user } = useAuth();
  const [id, setId] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedService, setEditedService] = useState<Omit<Service, 'id'>>({
    shop_id: '',
    name: '',
    description: '',
    price: 0,
    duration: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Helper to safely get number value for inputs (prevents NaN)
  const getNumberValue = (value: number | string | undefined): string | number => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (isNaN(value as number)) return '';
    return value;
  };

  useEffect(() => {
    const serviceId = params?.id as string | undefined;
    if (serviceId && typeof serviceId === 'string') {
      setId(serviceId);
    }
  }, [params]);

  const fetchServiceData = useCallback(async () => {
    if (!id) return;

    try {
      const serviceRes = await fetch(`${apiUrl}/services/${id}`);
      if (serviceRes.ok) {
        const serviceData = await serviceRes.json();
        setService(serviceData);
        // Use duration_minutes if available, fallback to duration
        const durationValue = serviceData.duration_minutes !== undefined 
          ? serviceData.duration_minutes 
          : (serviceData.duration || 0);
        setEditedService({
          shop_id: serviceData.shop_id || '',
          name: serviceData.name || '',
          description: serviceData.description || '',
          price: serviceData.price || 0,
          duration: durationValue,
        });

        // Fetch shop details
        if (serviceData.shop_id) {
          const shopRes = await fetch(`${apiUrl}/shops/${serviceData.shop_id}`);
          if (shopRes.ok) {
            const shopData = await shopRes.json();
            setShop(shopData);
          }
        }
      } else {
        setError('Failed to load service');
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("Failed to fetch service data:", error);
        setError('Failed to load service data');
      }
    }
  }, [id, apiUrl]);

  useEffect(() => {
    if (id) {
      fetchServiceData();
    }
  }, [id, fetchServiceData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    
    // Handle number inputs - convert to number, but keep as string if empty/invalid
    if (type === 'number') {
      const numValue = parseFloat(value);
      // If input is empty or invalid, use empty string (will be converted to 0 on blur/submit)
      // Otherwise use the parsed number
      processedValue = isNaN(numValue) ? '' : numValue;
    }
    
    setEditedService(prev => ({ ...prev, [name]: processedValue }));
  };

  const updateService = async () => {
    if (!id) {
      setError('Invalid service ID');
      return;
    }

    if (!user) {
      setError('You must be logged in to update a service');
      return;
    }

    setError(null);
    try {
      // Map duration to duration_minutes for the API
      // Ensure duration is a valid number (not empty string or NaN)
      const durationValue = editedService.duration;
      const numDuration = typeof durationValue === 'string' && durationValue !== '' 
        ? parseFloat(durationValue) 
        : (typeof durationValue === 'number' ? durationValue : 0);
      
      const updateData: any = {
        name: editedService.name,
        description: editedService.description,
        price: editedService.price,
        duration_minutes: !isNaN(numDuration) && numDuration >= 0 ? numDuration : editedService.duration,
      };

      // Only include shop_id if it's being changed
      if (editedService.shop_id && editedService.shop_id !== service?.shop_id) {
        updateData.shop_id = editedService.shop_id;
      }

      const res = await fetch(`${apiUrl}/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updatedService = await res.json();
        setService(updatedService);
        setEditMode(false);
        setError(null);
        // Refresh service data to get latest from server
        await fetchServiceData();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || `Failed to update service: ${res.status}`);
      }
    } catch (error: any) {
      // Silently handle connection errors (API server not running)
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error("Failed to update service:", error);
        setError('Failed to update service. Please try again.');
      }
    }
  };

  if (error && !service) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p>{error}</p>
          <Link href="/shops/services" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Services List
          </Link>
        </div>
      </div>
    );
  }

  if (!id || !service) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading service details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/shops/services" className="text-blue-600 hover:text-blue-800 hover:underline mb-6 inline-flex items-center gap-2">
        <span>←</span> Back to Services List
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Details</h1>
        <p className="text-gray-600">View and edit service information</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Service Information</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {editMode ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
              <input
                type="text"
                name="name"
                placeholder="Service Name"
                value={editedService.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Description"
                value={editedService.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={getNumberValue(editedService.price)}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  placeholder="Duration"
                  value={getNumberValue(editedService.duration)}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  min="1"
                />
              </div>
            </div>
            <button
              onClick={updateService}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Update Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="text-lg font-semibold text-gray-800">{service.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Shop</p>
              <p className="text-lg text-gray-800">{shop?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-lg text-gray-800">{service.description || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Price</p>
              <p className="text-lg font-semibold text-gray-800">${service.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Duration</p>
              <p className="text-lg text-gray-800">{(service.duration_minutes !== undefined ? service.duration_minutes : service.duration) || 0} minutes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetailsPage;

