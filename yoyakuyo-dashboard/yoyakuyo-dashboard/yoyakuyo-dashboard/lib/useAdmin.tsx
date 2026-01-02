// Hook to check if current user has admin role - uses Supabase Auth
"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabaseClient } from "./supabaseClient";
import { apiUrl } from "./apiClient";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setLoading(false);
          setIsAdmin(false);
          lastUserIdRef.current = null;
          return;
        }

        const userId = session.user.id;

        // If user hasn't changed, don't re-check
        if (userId === lastUserIdRef.current && lastUserIdRef.current !== null) {
          return;
        }

        // Check admin status by trying to access admin stats endpoint
        // This will return 403 if not admin, 200 if admin
        checkingRef.current = true;
        
        const response = await fetch(`${apiUrl}/admin/stats`, {
          headers: {
            "x-user-id": userId,
            "Content-Type": "application/json",
          },
        });

        setIsAdmin(response.ok);
        lastUserIdRef.current = userId;
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        lastUserIdRef.current = null;
      } finally {
        setLoading(false);
        checkingRef.current = false;
      }
    };

    checkAdminStatus();

    // Listen for auth state changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Reset and re-check when auth state changes
      lastUserIdRef.current = null;
      checkingRef.current = false;
      checkAdminStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}

