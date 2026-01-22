"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuthRole } from '@/lib/AuthRoleContext';

const Modal = React.memo(({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div 
      // Dim + blur overlay so it feels like a modal (not a navigation to a blank page),
      // while still preventing interaction with the landing page behind it.
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

export default function RoleSelectionModal() {
  const router = useRouter();
  const { setSelectedRole } = useAuthRole();
  const t = useTranslations('landing');
  let tAuth: ReturnType<typeof useTranslations>;
  try {
    tAuth = useTranslations('auth');
  } catch {
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'join'>('login');

  // Lock background scroll while modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [isOpen]);

  useEffect(() => {
    const handleOpenLogin = () => {
      setMode('login');
      setIsOpen(true);
    };
    const handleOpenJoin = () => {
      setMode('join');
      setIsOpen(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('openLoginModal', handleOpenLogin);
      window.addEventListener('openSignupModal', handleOpenJoin);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openLoginModal', handleOpenLogin);
        window.removeEventListener('openSignupModal', handleOpenJoin);
      }
    };
  }, []);

  const handleCustomerClick = () => {
    // CRITICAL: Persist role BEFORE showing login inputs
    setSelectedRole("customer");
    
    setIsOpen(false);
    // If a valid customer custom-auth session exists, restore and redirect immediately.
    try {
      const storedSession = localStorage.getItem("yoyaku_session");
      const storedUser = localStorage.getItem("yoyaku_user");
      if (storedSession && storedUser) {
        const sessionData = JSON.parse(storedSession) as { expires_at?: string; role?: string };
        const userData = JSON.parse(storedUser) as { role?: string };
        const expiresAt = sessionData?.expires_at ? new Date(sessionData.expires_at) : null;
        const notExpired = !!expiresAt && expiresAt > new Date();
        const role = sessionData?.role || userData?.role;
        if (notExpired && role === "customer") {
          router.push("/customer/home");
          router.refresh();
          return;
        }
      }
    } catch {
      // ignore parse errors
    }

    // Otherwise open customer modal (stay on landing and show modal)
    if (mode === 'login') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openCustomerLoginModal'));
      }, 100);
    } else {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openCustomerSignupModal'));
      }, 100);
    }
  };

  const handleOwnerClick = () => {
    // CRITICAL: Persist role BEFORE showing login inputs
    setSelectedRole("owner");
    
    setIsOpen(false);
    // If a Supabase session exists, restore and redirect immediately.
    try {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.push("/shops");
          router.refresh();
          return;
        }

        // No session: open owner modal
        setTimeout(() => {
          if (mode === 'login') {
            window.dispatchEvent(new CustomEvent('openOwnerLoginModal'));
          } else {
            window.dispatchEvent(new CustomEvent('openOwnerSignupModal'));
          }
        }, 100);
      }).catch(() => {
        setTimeout(() => {
          if (mode === 'login') {
            window.dispatchEvent(new CustomEvent('openOwnerLoginModal'));
          } else {
            window.dispatchEvent(new CustomEvent('openOwnerSignupModal'));
          }
        }, 100);
      });
      return;
    } catch {
      // fallthrough: open modal
    }

    // Dispatch event to open owner modal
    setTimeout(() => {
      if (mode === 'login') {
        window.dispatchEvent(new CustomEvent('openOwnerLoginModal'));
      } else {
        window.dispatchEvent(new CustomEvent('openOwnerSignupModal'));
      }
    }, 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {mode === 'login' 
          ? (tAuth('signIn') || 'Login')
          : (tAuth('signUp') || 'Create Account')
        }
      </h2>

      <div className="space-y-4">
        {/* Customer Option */}
        <button
          onClick={handleCustomerClick}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center shadow-md hover:shadow-lg"
        >
          {mode === 'login' 
            ? (tAuth('loginAsCustomer') || 'Login as Customer')
            : (tAuth('joinAsCustomer') || 'Join as Customer')
          }
        </button>

        {/* Owner Option */}
        <button
          onClick={handleOwnerClick}
          className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center border-2 border-gray-300"
        >
          {mode === 'login' 
            ? (tAuth('loginAsOwner') || 'Login as Owner')
            : (tAuth('joinAsOwner') || 'Join as Owner')
          }
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === 'login' 
          ? (tAuth('dontHaveAccount') || "Don't have an account?")
          : (tAuth('alreadyHaveAccount') || 'Already have an account?')
        }{' '}
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'join' : 'login');
          }}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {mode === 'login' 
            ? (tAuth('signUp') || 'Sign Up')
            : (tAuth('signIn') || 'Sign In')
          }
        </button>
      </p>
    </Modal>
  );
}

