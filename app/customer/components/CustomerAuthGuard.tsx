"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomAuth } from "@/lib/useCustomAuth";

export default function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useCustomAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkCustomerAuth = async () => {
      if (loading) return;

      if (!user) {
        // No user, redirect to customer login
        router.push("/customer-login");
        return;
      }


      // Check if user is a customer
      if (role !== 'customer') {
        // User is an owner, redirect to owner dashboard
        router.push("/dashboard");
        return;
      }

      setChecking(false);
    };

    checkCustomerAuth();
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== 'customer') {
    return null; // Will redirect
  }

  return <>{children}</>;
}

