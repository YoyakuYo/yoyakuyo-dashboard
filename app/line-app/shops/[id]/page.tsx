"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/apiClient";

export const dynamic = 'force-dynamic';

interface Shop {
  id: string;
  name: string;
  address?: string;
  description?: string;
  phone?: string;
  main_image_url?: string;
  image_url?: string;
  cover_photo_url?: string;
  logo_url?: string;
  category?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
  description?: string;
}

export default function LineShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    const fetchShop = async () => {
      try {
        const res = await fetch(`${apiUrl}/shops/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    };

    const fetchServices = async () => {
      try {
        const res = await fetch(`${apiUrl}/services?shop_id=${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : data.services || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
    fetchServices();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Shop not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">{shop.name}</h1>
          </div>
        </div>
      </header>

      {/* Shop Image */}
      {(shop.main_image_url || shop.image_url || shop.cover_photo_url || shop.logo_url) && (
        <div className="w-full h-64 bg-gray-200">
          <img
            src={shop.main_image_url || shop.image_url || shop.cover_photo_url || shop.logo_url}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Shop Details */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{shop.name}</h2>
          
          {shop.address && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">📍 Address</p>
              <p className="text-gray-900">{shop.address}</p>
            </div>
          )}

          {shop.phone && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">📞 Phone</p>
              <p className="text-gray-900">{shop.phone}</p>
            </div>
          )}

          {shop.description && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-900">{shop.description}</p>
            </div>
          )}
        </div>

        {/* Booking Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl border border-blue-500 p-6 mb-6 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-2">📅 Book an Appointment</h3>
          <p className="text-blue-100 mb-4">
            Select a service and choose your preferred date and time
          </p>
          <Link
            href={`/line-app/book/${shopId}`}
            className="inline-block w-full text-center bg-white text-blue-600 py-3 px-6 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-md"
          >
            Book Now →
          </Link>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Services</h3>
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No services available</p>
              <p className="text-sm text-gray-500 mb-4">
                You can still book an appointment by clicking "Book Now" above
              </p>
              <Link
                href={`/line-app/book/${shopId}`}
                className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Book Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    {service.price && (
                      <span className="text-blue-600 font-bold">¥{service.price}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Duration: {service.duration} minutes
                  </p>
                  {service.description && (
                    <p className="text-sm text-gray-500 mb-3">{service.description}</p>
                  )}
                  <Link
                    href={`/line-app/book/${shopId}?service_id=${service.id}`}
                    className="inline-block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Book This Service
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

