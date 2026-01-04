"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { apiUrl } from "@/lib/apiClient";

interface OwnerGuardProps {
  children: React.ReactNode;
}

/**
 * OwnerGuard - Protects owner routes by verifying user has owner role
 * Only users with role='owner' in the users table can access owner routes
 * Users must sign up as owners and verify their email before accessing
 */
export default function OwnerGuard({ children }: OwnerGuardProps) {
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
    checkOwnerRole();
  }, [user, authLoading, router]);

  const checkOwnerRole = async () => {
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

        // CRITICAL: Only allow users with role='owner' in users table
        if (role === 'owner') {
          setIsAuthorized(true);
        } else {
          // User is not an owner - redirect to login with error message
          console.error('[OwnerGuard] Access denied: User role is not owner', { 
            userId: user.id, 
            role,
            email: user.email 
          });
          router.push('/login?error=owner_access_required');
        }
      } else {
        // Failed to verify role - deny access
        console.error('[OwnerGuard] Failed to verify user role');
        router.push('/login?error=verification_failed');
      }
    } catch (error) {
      console.error('[OwnerGuard] Error checking user role:', error);
      router.push('/login?error=verification_failed');
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

  // Only render children if user is authorized owner
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

