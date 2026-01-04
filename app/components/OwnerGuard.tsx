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
      // CRITICAL: Query users table DIRECTLY from frontend (bypass API)
      // This is more reliable than /users/me endpoint which may return 404
      const { getSupabaseClient } = await import('@/lib/supabaseClient');
      const supabase = getSupabaseClient();
      
      // Check users table directly for role='owner'
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userError) {
        console.warn('[OwnerGuard] Error checking users table:', userError);
      }
      
      // If user exists in users table with role='owner', grant access immediately
      if (userData && userData.role === 'owner') {
        console.log('[OwnerGuard] ✅ Owner found in users table with role=owner:', userData);
        setIsAuthorized(true);
        setRoleLoading(false);
        return;
      }
      
      // If user exists but role is not 'owner', check if we can update it
      if (userData && userData.role !== 'owner') {
        console.log('[OwnerGuard] User exists but role is not owner:', userData.role);
        
        // Check owners table as fallback
        const { data: ownerData } = await supabase
          .from('owners')
          .select('id, email')
          .or(`id.eq.${user.id},email.eq.${user.email?.toLowerCase().trim() || ''}`)
          .maybeSingle();
        
        if (ownerData) {
          console.log('[OwnerGuard] Owner found in owners table, updating users table role...');
          // Try to update role in users table (non-blocking)
          await supabase
            .from('users')
            .update({ role: 'owner' })
            .eq('id', user.id)
            .then(() => {
              console.log('[OwnerGuard] ✅ Updated user role to owner');
              setIsAuthorized(true);
              setRoleLoading(false);
            })
            .catch((updateError) => {
              console.warn('[OwnerGuard] Failed to update role (non-blocking):', updateError);
              // Still grant access if found in owners table
              setIsAuthorized(true);
              setRoleLoading(false);
            });
          return;
        }
      }
      
      // If user doesn't exist in users table, check owners table
      if (!userData) {
        console.log('[OwnerGuard] User not found in users table, checking owners table...');
        
        const { data: ownerData, error: ownerError } = await supabase
          .from('owners')
          .select('id, email')
          .or(`id.eq.${user.id},email.eq.${user.email?.toLowerCase().trim() || ''}`)
          .maybeSingle();
        
        if (ownerError) {
          console.warn('[OwnerGuard] Error checking owners table:', ownerError);
        }
        
        if (ownerData) {
          console.log('[OwnerGuard] ✅ Owner found in owners table:', ownerData);
          
          // Try to sync owner to users table with role='owner' (non-blocking)
          if (apiUrl) {
            try {
              const { authApi } = await import('@/lib/api');
              await authApi.syncUser(
                user.id,
                user.email || ownerData.email || '',
                undefined
              ).then(() => {
                // After sync, update role to owner
                supabase
                  .from('users')
                  .update({ role: 'owner' })
                  .eq('id', user.id)
                  .catch(() => {
                    console.warn('[OwnerGuard] Failed to update role after sync');
                  });
              }).catch((syncError) => {
                console.warn('[OwnerGuard] Failed to sync user (non-blocking):', syncError);
              });
            } catch (syncError) {
              console.warn('[OwnerGuard] Failed to sync owner (non-blocking):', syncError);
            }
          }
          
          // Grant access if found in owners table
          setIsAuthorized(true);
          setRoleLoading(false);
          return;
        }
      }

      // If we reach here, user is not an owner
      console.error('[OwnerGuard] ❌ Access denied: User is not an owner', { 
        userId: user.id, 
        email: user.email,
        userData: userData ? { role: userData.role } : 'not found in users table'
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

