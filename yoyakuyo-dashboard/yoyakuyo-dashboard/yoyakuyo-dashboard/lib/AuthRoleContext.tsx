"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthRole = "owner" | "customer" | null;

interface AuthRoleContextType {
  selectedRole: AuthRole;
  setSelectedRole: (role: AuthRole) => void;
  clearSelectedRole: () => void;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

const AUTH_ROLE_STORAGE_KEY = "yoyaku_selected_auth_role";

export function AuthRoleProvider({ children }: { children: ReactNode }) {
  const [selectedRole, setSelectedRoleState] = useState<AuthRole>(null);

  // Load role from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
        if (stored === "owner" || stored === "customer") {
          setSelectedRoleState(stored);
        }
      } catch (e) {
        console.warn("Failed to load auth role from localStorage:", e);
      }
    }
  }, []);

  const setSelectedRole = (role: AuthRole) => {
    setSelectedRoleState(role);
    if (typeof window !== "undefined") {
      try {
        if (role) {
          localStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
        } else {
          localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
        }
      } catch (e) {
        console.warn("Failed to save auth role to localStorage:", e);
      }
    }
  };

  const clearSelectedRole = () => {
    setSelectedRoleState(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
      } catch (e) {
        console.warn("Failed to clear auth role from localStorage:", e);
      }
    }
  };

  return (
    <AuthRoleContext.Provider
      value={{
        selectedRole,
        setSelectedRole,
        clearSelectedRole,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole() {
  const context = useContext(AuthRoleContext);
  if (context === undefined) {
    throw new Error("useAuthRole must be used within an AuthRoleProvider");
  }
  return context;
}

