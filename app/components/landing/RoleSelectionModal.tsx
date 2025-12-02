"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const Modal = React.memo(({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" 
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
  const t = useTranslations('landing');
  let tAuth: ReturnType<typeof useTranslations>;
  try {
    tAuth = useTranslations('auth');
  } catch {
    tAuth = ((key: string) => key) as ReturnType<typeof useTranslations>;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'join'>('login');

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
    setIsOpen(false);
    // Navigate to customer login/signup page
    if (mode === 'login') {
      router.push('/customer-login');
    } else {
      router.push('/customer-signup');
    }
  };

  const handleOwnerClick = () => {
    setIsOpen(false);
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

