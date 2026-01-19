"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  google_place_id?: string | null;
  city?: string | null;
  country?: string | null;
  zip_code?: string | null;
  description?: string | null;
  language_code?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: any | null;
  business_status?: string | null;
  category_id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  owner_user_id?: string | null;
  claim_status?: 'unclaimed' | 'pending' | 'approved' | 'rejected' | null;
  claimed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface ShopContextType {
  shop: Shop | null;
  loading: boolean;
  error: string | null;
  refreshShop: () => Promise<void>;
  updateShop: (updatedShop: Partial<Shop>) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

interface ShopProviderProps {
  children: ReactNode;
}

export const ShopProvider: React.FC<ShopProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch shops owned by user - backend filters by owner_user_id when my_shops=true
      const url = `${apiUrl}/shops?my_shops=true&page=1&limit=1`;

      let res;
      try {
        res = await fetch(url, {
          headers: {
            'x-user-id': user.id,
            'Content-Type': 'application/json',
          },
        });
      } catch (fetchError: any) {
        // Handle connection errors gracefully
        if (fetchError?.message?.includes('Failed to fetch') || fetchError?.message?.includes('ERR_CONNECTION_REFUSED')) {
          setShop(null);
          setLoading(false);
          return;
        }
        throw fetchError;
      }

      if (res.status === 404) {
        // User owns no shop
        setShop(null);
        setLoading(false);
        return;
      }

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const response = await res.json();
          // Backend returns paginated: { shops: [...], page, limit, total, totalPages }
          const shopsArray = Array.isArray(response)
            ? response
            : (response.shops && Array.isArray(response.shops)
              ? response.shops
              : (response.data && Array.isArray(response.data)
                ? response.data
                : []));

          if (shopsArray.length > 0) {
            setShop(shopsArray[0]);
          } else {
            setShop(null);
          }
        } else {
          setError('Expected JSON but received ' + contentType);
        }
      } else {
        const errorText = await res.text();
        setError(`Failed to fetch shop: ${res.status} ${errorText}`);
      }
    } catch (error: any) {
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching shop:', error);
        setError(error.message || 'Failed to fetch shop');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshShop = async () => {
    await fetchShop();
  };

  const updateShop = (updatedShop: Partial<Shop>) => {
    if (shop) {
      setShop({ ...shop, ...updatedShop });
    }
  };

  // Load shop when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchShop();
    }
  }, [user?.id, authLoading]);

  const value: ShopContextType = {
    shop,
    loading,
    error,
    refreshShop,
    updateShop,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};