// app/components/BrowseAIContext.tsx
// Context to share browse page state with global AI bubble

"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Shop {
  id: string;
  name: string;
  address?: string | null;
  prefecture?: string | null;
  normalized_city?: string | null;
  city?: string | null;
  category_id?: string | null;
  description?: string | null;
}

interface ShopContext {
  shopId?: string | null;
  shopName?: string | null;
  category?: string | null;
  prefecture?: string | null;
  address?: string | null;
  ownerId?: string | null;
  services?: Array<{ id: string; name: string; price?: number }> | null;
}

interface BrowseAIContextType {
  shops: Shop[];
  selectedPrefecture: string | null;
  selectedCity: string | null;
  selectedCategoryId: string | null;
  searchQuery: string | null;
  shopContext: ShopContext | null;
  setBrowseContext: (context: {
    shops?: Shop[];
    selectedPrefecture?: string | null;
    selectedCity?: string | null;
    selectedCategoryId?: string | null;
    searchQuery?: string | null;
    shopContext?: ShopContext | null;
  }) => void;
}

const BrowseAIContext = createContext<BrowseAIContextType | null>(null);

export function BrowseAIProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [shopContext, setShopContext] = useState<ShopContext | null>(null);

  const setBrowseContext = (context: {
    shops?: Shop[];
    selectedPrefecture?: string | null;
    selectedCity?: string | null;
    selectedCategoryId?: string | null;
    searchQuery?: string | null;
    shopContext?: ShopContext | null;
  }) => {
    if (context.shops !== undefined) setShops(context.shops);
    if (context.selectedPrefecture !== undefined) setSelectedPrefecture(context.selectedPrefecture);
    if (context.selectedCity !== undefined) setSelectedCity(context.selectedCity);
    if (context.selectedCategoryId !== undefined) setSelectedCategoryId(context.selectedCategoryId);
    if (context.searchQuery !== undefined) setSearchQuery(context.searchQuery);
    if (context.shopContext !== undefined) setShopContext(context.shopContext);
  };

  return (
    <BrowseAIContext.Provider value={{
      shops,
      selectedPrefecture,
      selectedCity,
      selectedCategoryId,
      searchQuery,
      shopContext,
      setBrowseContext,
    }}>
      {children}
    </BrowseAIContext.Provider>
  );
}

export function useBrowseAIContext() {
  const context = useContext(BrowseAIContext);
  return context;
}

