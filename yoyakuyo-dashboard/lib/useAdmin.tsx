// Hook to check if current user has admin role
"use client";

import { useState, useEffect } from "react";
import { useCustomAuth } from "./useCustomAuth";
import { apiUrl } from "./apiClient";

export function useAdmin() {
  const { user, loading: authLoading, role } = useCustomAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    // Only check admin status for owners (customers can't be admins)
    if (role !== 'owner') {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    // Check admin status by trying to access admin stats endpoint
    // This will return 403 if not admin, 200 if admin
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${apiUrl}/admin/stats`, {
          headers: {
            "x-user-id": user.id,
            "Content-Type": "application/json",
          },
        });

        setIsAdmin(response.ok);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, role]);

  return { isAdmin, loading: loading || authLoading };
}

