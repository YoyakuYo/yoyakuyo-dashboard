"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    // If not authenticated, redirect to customer login
    if (!user) {
      router.push("/customer-login");
      return;
    }

    // Check user role from database
    checkCustomerRole();
  }, [user, authLoading, router]);

  const checkCustomerRole = async () => {
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
      
      // Check users table directly for role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userError) {
        console.warn('[CustomerAuthGuard] Error checking users table:', userError);
      }
      
      // If user exists in users table, check role
      if (userData) {
        const role = userData.role;

        // CRITICAL: Block owners and admins from accessing customer routes
        if (role === 'owner') {
          // User is an owner - redirect to owner dashboard
          console.error('[CustomerAuthGuard] Access denied: User is owner', { 
            userId: user.id, 
            role,
            email: user.email 
          });
          router.push('/owner/shop-profile?error=owner_cannot_access_customer_dashboard');
          setRoleLoading(false);
          return;
        } else if (role === 'admin' || role === 'super_admin') {
          // User is an admin - redirect to admin dashboard
          console.error('[CustomerAuthGuard] Access denied: User is admin', { 
            userId: user.id, 
            role,
            email: user.email 
          });
          router.push('/admin?error=admin_cannot_access_customer_dashboard');
          setRoleLoading(false);
          return;
        } else {
          // Customer or no role (default to customer) - allow access
          console.log('[CustomerAuthGuard] ✅ Customer access granted:', { role: role || 'no role (default customer)' });
          setIsAuthorized(true);
          setRoleLoading(false);
          return;
        }
      }
      
      // If user doesn't exist in users table, check owners table to block owners
      const { data: ownerData } = await supabase
        .from('owners')
        .select('id, email')
        .or(`id.eq.${user.id},email.eq.${user.email?.toLowerCase().trim() || ''}`)
        .maybeSingle();
      
      if (ownerData) {
        // User is an owner - redirect to owner dashboard
        console.error('[CustomerAuthGuard] Access denied: User is owner (found in owners table)', { 
          userId: user.id, 
          email: user.email 
        });
        router.push('/owner/shop-profile?error=owner_cannot_access_customer_dashboard');
        setRoleLoading(false);
        return;
      }
      
      // User not found in users or owners table - allow access (default to customer)
      // This is safer for customers who might not be synced to users table yet
      console.log('[CustomerAuthGuard] ✅ User not found in users/owners table, allowing access (default to customer)');
      setIsAuthorized(true);
    } catch (error) {
      // If role check fails, allow access (safer for customers)
      console.error('[CustomerAuthGuard] Error checking user role:', error);
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

