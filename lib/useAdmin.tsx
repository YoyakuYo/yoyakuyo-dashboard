// Hook to check if current user has admin role
"use client";

import { useState, useEffect, useRef } from "react";
import { useCustomAuth } from "./useCustomAuth";
import { apiUrl } from "./apiClient";

export function useAdmin() {
  const { user, loading: authLoading, role } = useCustomAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }

    // If user hasn't changed, don't re-check
    if (user?.id === lastUserIdRef.current && lastUserIdRef.current !== null) {
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      setIsAdmin(false);
      lastUserIdRef.current = null;
      return;
    }

    // Only check admin status for owners (customers can't be admins)
    if (role !== 'owner') {
      setLoading(false);
      setIsAdmin(false);
      lastUserIdRef.current = user.id;
      return;
    }

    // Check admin status by trying to access admin stats endpoint
    // This will return 403 if not admin, 200 if admin
    checkingRef.current = true;
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${apiUrl}/admin/stats`, {
          headers: {
            "x-user-id": user.id,
            "Content-Type": "application/json",
          },
        });

        setIsAdmin(response.ok);
        lastUserIdRef.current = user.id;
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        lastUserIdRef.current = user.id;
      } finally {
        setLoading(false);
        checkingRef.current = false;
      }
    };

    checkAdmin();
  }, [user?.id, authLoading, role]);

  return { isAdmin, loading: loading || authLoading };
}

