// app/owner/create-shop/page.tsx
// Simple one-page shop creation: name, address, phone, category, services. No documents.

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import OwnerGuard from "@/app/components/OwnerGuard";
import { apiUrl } from "@/lib/apiClient";

interface ServiceRow {
  id: string;
  name: string;
  price: string;
}

export default function CreateShopPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [email, setEmail] = useState("");
  const [corporationNumber, setCorporationNumber] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([
    { id: "1", name: "", price: "" },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    fetchCategories();
  }, [user, authLoading, router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", price: "" },
    ]);
  };

  const removeService = (id: string) => {
    if (services.length <= 1) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const updateService = (id: string, field: "name" | "price", value: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !address.trim() || !phone.trim() || !categoryId) {
      setError("Please fill in shop name, address, phone, and category.");
      return;
    }

    const validServices = services.filter(
      (s) => s.name.trim() !== "" && s.price.trim() !== "" && !isNaN(Number(s.price))
    );
    if (validServices.length === 0) {
      setError("Add at least one service with name and price.");
      return;
    }

    if (!user?.id) {
      setError("You must be logged in.");
      return;
    }

    setLoading(true);
    try {
      const shopRes = await fetch(`${apiUrl}/shops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          category_id: categoryId || null,
          owner_user_id: user.id,
          business_registration_number: corporationNumber.trim() || null,
        }),
      });

      if (!shopRes.ok) {
        const errData = await shopRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create shop");
      }

      const shop = await shopRes.json();

      for (const svc of validServices) {
        const svcRes = await fetch(`${apiUrl}/services`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            shop_id: shop.id,
            name: svc.name.trim(),
            price: Number(svc.price),
            duration_minutes: 60,
          }),
        });
        if (!svcRes.ok) {
          console.warn("Failed to create service:", svc.name);
        }
      }

      router.push("/shops?created=1");
    } catch (err: any) {
      setError(err.message || "Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <OwnerGuard>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create your shop
        </h1>
        <p className="text-gray-600 mb-6">
          Enter your shop details and at least one service. No documents
          required.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. My Salon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 03-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="shop@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Corporation / Business registration number
            </label>
            <input
              type="text"
              value={corporationNumber}
              onChange={(e) => setCorporationNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Services * (name and price)
              </label>
              <button
                type="button"
                onClick={addService}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add service
              </button>
            </div>
            <div className="space-y-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex gap-2 items-center border border-gray-200 rounded-lg p-3"
                >
                  <input
                    type="text"
                    value={svc.name}
                    onChange={(e) =>
                      updateService(svc.id, "name", e.target.value)
                    }
                    placeholder="Service name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={svc.price}
                    onChange={(e) =>
                      updateService(svc.id, "price", e.target.value)
                    }
                    placeholder="Price"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(svc.id)}
                    disabled={services.length <= 1}
                    className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Remove service"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              At least one service with name and price is required.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create shop"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/shops")}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </OwnerGuard>
  );
}
