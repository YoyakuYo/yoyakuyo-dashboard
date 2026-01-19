// Custom authentication context with role-based support
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "./apiClient";

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'customer';
}

interface Session {
  token: string;
  role: 'owner' | 'customer';
  expires_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: 'owner' | 'customer' | null;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string, role: 'owner' | 'customer') => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role: 'owner' | 'customer', phone?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function CustomAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem('yoyaku_session');
        const storedUser = localStorage.getItem('yoyaku_user');

        if (storedSession && storedUser) {
          const sessionData = JSON.parse(storedSession);
          const userData = JSON.parse(storedUser);

          // Check if session is expired
          if (new Date(sessionData.expires_at) > new Date()) {
            setSession(sessionData);
            setUser(userData);
          } else {
            // Session expired, clear storage
            localStorage.removeItem('yoyaku_session');
            localStorage.removeItem('yoyaku_user');
          }
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = useCallback(async (
    email: string,
    password: string,
    role: 'owner' | 'customer'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const endpoint = role === 'owner' ? '/auth-owners/login' : '/auth-customers/login';
      const response = await fetch(`${apiUrl}${endpoint}`, {
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

      // Store session and user
      const sessionData = {
        token: data.session.token,
        role: data.session.role,
        expires_at: data.session.expires_at,
      };
      const userData = {
        id: role === 'owner' ? data.owner.id : data.customer.id,
        email: role === 'owner' ? data.owner.email : data.customer.email,
        name: role === 'owner' ? data.owner.name : data.customer.name,
        role: data.session.role,
      };

      localStorage.setItem('yoyaku_session', JSON.stringify(sessionData));
      localStorage.setItem('yoyaku_user', JSON.stringify(userData));

      setSession(sessionData);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      console.error("Error signing in:", error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'owner' | 'customer',
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const endpoint = role === 'owner' ? '/auth-owners/signup' : '/auth-customers/signup';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      // Store session and user
      const sessionData = {
        token: data.session.token,
        role: data.session.role,
        expires_at: data.session.expires_at,
      };
      const userData = {
        id: role === 'owner' ? data.owner.id : data.customer.id,
        email: role === 'owner' ? data.owner.email : data.customer.email,
        name: role === 'owner' ? data.owner.name : data.customer.name,
        role: data.session.role,
      };

      localStorage.setItem('yoyaku_session', JSON.stringify(sessionData));
      localStorage.setItem('yoyaku_user', JSON.stringify(userData));

      setSession(sessionData);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      console.error("Error signing up:", error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem('yoyaku_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        const role = sessionData.role;
        const endpoint = role === 'owner' ? '/auth-owners/logout' : '/auth-customers/logout';
        
        await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      localStorage.removeItem('yoyaku_session');
      localStorage.removeItem('yoyaku_user');
      setSession(null);
      setUser(null);
      router.push("/");
    }
  }, [router]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    role: user?.role || null,
    signOut,
    signIn,
    signUp,
  }), [user, session, loading, signOut, signIn, signUp]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCustomAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useCustomAuth must be used within CustomAuthProvider");
  }
  return context;
}

