// Hook to check if current user has admin role - uses independent admin auth
"use client";

import { useAdminAuth } from "./useAdminAuth";

export function useAdmin() {
  const { admin, loading } = useAdminAuth();
  
  return { 
    isAdmin: !!admin, 
    loading 
  };
}

