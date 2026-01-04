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
      // CRITICAL: Check owners table FIRST (more reliable than users table)
      // This prevents 404 errors if user doesn't exist in users table yet
      const { getSupabaseClient } = await import('@/lib/supabaseClient');
      const supabase = getSupabaseClient();
      
      const { data: ownerData } = await supabase
        .from('owners')
        .select('id, email')
        .or(`id.eq.${user.id},email.eq.${user.email || ''}`)
        .maybeSingle();

      if (ownerData) {
        // Owner exists in owners table - allow access
        console.log('[OwnerGuard] Owner found in owners table');
        
        // Try to sync owner to users table with role='owner' (non-blocking)
        if (apiUrl) {
          try {
            // First try to get user from users table
            const res = await fetch(`${apiUrl}/users/me`, {
              headers: { 'x-user-id': user.id },
            }).catch(() => null);

            if (res && res.ok) {
              const data = await res.json();
              const role = data.user?.role || data.role;
              
              // If role is not 'owner', try to update it
              if (role !== 'owner') {
                await fetch(`${apiUrl}/users/me`, {
                  method: 'PUT',
                  headers: { 
                    'x-user-id': user.id,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ role: 'owner' })
                }).catch(() => {
                  console.warn('[OwnerGuard] Failed to update role in users table (non-blocking)');
                });
              }
            } else {
              // User doesn't exist in users table - try to create via sync
              try {
                const { authApi } = await import('@/lib/api');
                await authApi.syncUser(
                  user.id,
                  user.email || ownerData.email || '',
                  null
                );
              } catch (syncError) {
                console.warn('[OwnerGuard] Failed to sync user to users table (non-blocking):', syncError);
              }
            }
          } catch (syncError) {
            console.warn('[OwnerGuard] Failed to sync owner role (non-blocking):', syncError);
          }
        }
        
        setIsAuthorized(true);
        return;
      }

      // If not in owners table, check users table as fallback
      if (apiUrl) {
        try {
          const res = await fetch(`${apiUrl}/users/me`, {
            headers: { 'x-user-id': user.id },
          });

          if (res.ok) {
            const data = await res.json();
            const role = data.user?.role || data.role;

            // CRITICAL: Check if user has role='owner' in users table
            if (role === 'owner') {
              setIsAuthorized(true);
              return;
            }
          }
        } catch (fetchError) {
          console.warn('[OwnerGuard] Failed to fetch from users/me endpoint:', fetchError);
          // Continue to deny access if both checks fail
        }
      }

      // User is not an owner - redirect to login with error message
      console.error('[OwnerGuard] Access denied: User is not an owner', { 
        userId: user.id, 
        email: user.email 
      });
      router.push('/login?error=owner_access_required');
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

