// apps/dashboard/app/components/LineLoginButton.tsx
// LINE login button component

"use client";
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';

interface LineLoginButtonProps {
  onSuccess?: (lineUser: any) => void;
  className?: string;
}

export default function LineLoginButton({ onSuccess, className }: LineLoginButtonProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/line/auth-url`);
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          alert('LINE integration is not configured');
        }
      } else {
        alert('Failed to initiate LINE login');
      }
    } catch (error) {
      console.error('Error initiating LINE login:', error);
      alert('Failed to initiate LINE login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-[#06C755] text-white rounded-md hover:bg-[#05B048] disabled:opacity-50 ${className || ''}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.63.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.086.768-.003 1.08l-.164.633c-.037.143-.143.232-.31.232-.05 0-.091-.006-.13-.015l-1.567-.38c-.36-.088-.72-.19-1.08-.3-1.5-.45-2.7-1.05-3.6-1.8-2.25-1.65-3.45-3.75-3.45-6.054 0-4.54 4.875-8.252 10.875-8.252S22.875 5.774 22.875 10.314c0 2.304-1.2 4.404-3.45 6.054-.9.75-2.1 1.35-3.6 1.8-.36.11-.72.212-1.08.3l-1.567.38c-.039.009-.08.015-.13.015-.167 0-.273-.089-.31-.232l-.164-.633c-.089-.312-.123-.779-.003-1.08.135-.332.667-.508 1.058-.59C19.73 19.156 24 15.125 24 10.314z" />
      </svg>
      {loading ? t('common.loading') : t('line.loginWithLine')}
    </button>
  );
}

