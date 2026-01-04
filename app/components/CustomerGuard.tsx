"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";

interface CustomerGuardProps {
  children: React.ReactNode;
}

/**
 * CustomerGuard - Protects customer routes by verifying user has customer role
 * Only users with role='customer' or no role (default customer) can access customer routes
 * Owners and admins are blocked from accessing customer dashboard
 */
export default function CustomerGuard({ children }: CustomerGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // If not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Check user role
    checkCustomerRole();
  }, [user, authLoading, router]);

  const checkCustomerRole = async () => {
    if (!user?.id) {
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { 'x-user-id': user.id },
      });

      if (res.ok) {
        const data = await res.json();
        const role = data.user?.role || data.role;

        // CRITICAL: Only allow customers (role='customer' or null/undefined)
        // Block owners and admins from accessing customer routes
        if (role === 'owner' || role === 'admin') {
          // User is an owner or admin - redirect to their dashboard
          console.error('[CustomerGuard] Access denied: User is owner/admin', { 
            userId: user.id, 
            role,
            email: user.email 
          });
          if (role === 'owner') {
            router.push('/login?error=owner_cannot_access_customer_dashboard');
          } else {
            router.push('/login?error=admin_cannot_access_customer_dashboard');
          }
        } else {
          // Customer or no role (default to customer) - allow access
          setIsAuthorized(true);
        }
      } else {
        // If role check fails, allow access (safer for customers)
        console.warn('[CustomerGuard] Failed to verify user role, allowing access');
        setIsAuthorized(true);
      }
    } catch (error) {
      // If role check fails, allow access (safer for customers)
      console.error('[CustomerGuard] Error checking user role:', error);
      setIsAuthorized(true);
    } finally {
      setRoleLoading(false);
    }
  };

  // Show loading state while checking authentication and role
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is authorized customer
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

