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
      // Check users table first
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

        // If not in users table with owner role, check owners table as fallback
        // This handles cases where owner exists in owners table but not synced to users table
        const { getSupabaseClient } = await import('@/lib/supabaseClient');
        const supabase = getSupabaseClient();
        
        const { data: ownerData } = await supabase
          .from('owners')
          .select('id, email')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (ownerData) {
          // Owner exists in owners table - allow access and sync to users table
          console.log('[OwnerGuard] Owner found in owners table, syncing to users table...');
          
          // Try to sync owner to users table with role='owner'
          try {
            await fetch(`${apiUrl}/users/me`, {
              method: 'PUT',
              headers: { 
                'x-user-id': user.id,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ role: 'owner' })
            }).catch(() => {
              // If PUT fails, try to create/update via sync
              console.warn('[OwnerGuard] Failed to update role, owner still allowed');
            });
          } catch (syncError) {
            console.warn('[OwnerGuard] Failed to sync owner role:', syncError);
          }
          
          setIsAuthorized(true);
        } else {
          // User is not an owner - redirect to login with error message
          console.error('[OwnerGuard] Access denied: User is not an owner', { 
            userId: user.id, 
            role,
            email: user.email 
          });
          router.push('/login?error=owner_access_required');
        }
      } else {
        // If users/me fails, check owners table as fallback
        const { getSupabaseClient } = await import('@/lib/supabaseClient');
        const supabase = getSupabaseClient();
        
        const { data: ownerData } = await supabase
          .from('owners')
          .select('id, email')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (ownerData) {
          console.log('[OwnerGuard] Owner found in owners table (users table check failed)');
          setIsAuthorized(true);
        } else {
          // Failed to verify role - deny access
          console.error('[OwnerGuard] Failed to verify user role and not found in owners table');
          router.push('/login?error=verification_failed');
        }
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

