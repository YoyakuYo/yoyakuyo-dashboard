// apps/dashboard/app/(owner)/settings/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPreferredLanguage(data.preferredLanguage || 'en');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch(`${apiUrl}/users/me/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          preferredLanguage,
        }),
      });

      // Check content type before parsing
      const contentType = res.headers.get('content-type');
      let responseData: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await res.json();
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          setMessage({ type: 'error', text: 'Failed to parse server response' });
          return;
        }
      } else {
        // Non-JSON response - try to read as text
        const text = await res.text();
        console.warn('Non-JSON response from server:', text);
        if (res.ok) {
          setMessage({ type: 'success', text: 'Preferences saved successfully!' });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        } else {
          setMessage({ type: 'error', text: text || 'Failed to save preferences' });
          return;
        }
      }

      if (res.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Show the actual error message from the API
        const errorMessage = responseData.error || 'Failed to save preferences';
        const errorDetails = responseData.details ? `: ${responseData.details}` : '';
        console.error('API Error:', responseData);
        setMessage({ type: 'error', text: `${errorMessage}${errorDetails}` });
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      // Check if it's a JSON parse error
      if (error.message && error.message.includes('JSON')) {
        setMessage({ type: 'error', text: 'Invalid response from server. Please try again.' });
      } else {
        setMessage({ type: 'error', text: `Failed to save preferences: ${error.message || 'Network error'}` });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Language Preferences</h2>
        <p className="text-gray-600 mb-6">
          Choose your preferred language. All customer conversations will be translated to this language for you.
        </p>

        <div className="space-y-3">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label
              key={lang.code}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                preferredLanguage === lang.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="preferredLanguage"
                value={lang.code}
                checked={preferredLanguage === lang.code}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-lg font-medium text-gray-900">{lang.name}</span>
            </label>
          ))}
        </div>

        <button
          onClick={savePreferences}
          disabled={saving}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

