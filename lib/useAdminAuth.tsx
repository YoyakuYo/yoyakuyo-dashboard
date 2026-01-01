// Admin authentication context - completely independent from owner/customer auth
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "./apiClient";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin';
}

interface AdminSession {
  token: string;
  expires_at: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  session: AdminSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem('admin_session');
        const storedAdmin = localStorage.getItem('admin_user');

        if (storedSession && storedAdmin) {
          const sessionData = JSON.parse(storedSession);
          const adminData = JSON.parse(storedAdmin);

          // Check if session is expired
          if (new Date(sessionData.expires_at) > new Date()) {
            setSession(sessionData);
            setAdmin(adminData);
          } else {
            // Session expired, clear storage
            localStorage.removeItem('admin_session');
            localStorage.removeItem('admin_user');
          }
        }
      } catch (error) {
        console.error("Error loading admin session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // First, try to login as owner (since admin is in owners table)
      const response = await fetch(`${apiUrl}/auth-owners/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Verify the owner has admin role
      const ownerId = data.owner.id;
      const checkAdminResponse = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          "x-user-id": ownerId,
          "Content-Type": "application/json",
        },
      });

      if (!checkAdminResponse.ok) {
        return { success: false, error: 'Admin access required' };
      }

      // Store admin session and user
      const sessionData = {
        token: data.session.token,
        expires_at: data.session.expires_at,
      };
      const adminData = {
        id: data.owner.id,
        email: data.owner.email,
        name: data.owner.name,
        role: 'admin' as const,
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));
      localStorage.setItem('admin_user', JSON.stringify(adminData));

      setSession(sessionData);
      setAdmin(adminData);

      return { success: true };
    } catch (error: any) {
      console.error("Error signing in as admin:", error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('admin_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        
        // Call logout endpoint if available
        try {
          await fetch(`${apiUrl}/auth-owners/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionData.token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          // Ignore logout errors
        }
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_user');
      setSession(null);
      setAdmin(null);
      router.push("/admin");
    }
  }, [router]);

  const value = useMemo(() => ({
    admin,
    session,
    loading,
    signIn,
    signOut,
  }), [admin, session, loading, signIn, signOut]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

