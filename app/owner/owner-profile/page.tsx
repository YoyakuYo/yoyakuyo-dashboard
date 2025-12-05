// app/owner/owner-profile/page.tsx
// Owner profile editing page

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';

export default function OwnerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/owner/profiles`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Owner Profile</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Owner profile management coming soon...</p>
        {profile && (
          <div className="mt-4">
            <p>Name: {profile.full_name || 'Not set'}</p>
            <p>Email: {profile.personal_email || user?.email || 'Not set'}</p>
            <p>Phone: {profile.personal_phone || 'Not set'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

