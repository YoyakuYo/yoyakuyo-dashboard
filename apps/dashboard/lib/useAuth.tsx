// apps/dashboard/lib/useAuth.tsx
// Auth context and hook for Supabase authentication

"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // If env vars are missing, set loading to false and leave user as null
      // This allows the app to load, but auth features won't work
      console.warn("Supabase environment variables are missing. Authentication features are disabled.");
      setLoading(false);
      return;
    }

    // Get initial session - wrap in try-catch to handle any errors gracefully
    try {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("Error getting session:", error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((error) => {
        console.error("Error initializing auth:", error);
        setLoading(false);
      });

      // Listen for auth changes (this fires when session is set/updated/removed)
      try {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          // Update session and user state whenever auth state changes
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Log auth events for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log('Auth state changed:', event, session ? 'Session active' : 'No session');
          }
        });

        return () => {
          try {
            subscription.unsubscribe();
          } catch (e) {
            // Ignore unsubscribe errors
          }
        };
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        setLoading(false);
        return () => {};
      }
    } catch (error) {
      console.error("Error in auth initialization:", error);
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      // Still redirect even if signOut fails
      router.push("/");
    }
  }, [router]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signOut,
  }), [user, session, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

