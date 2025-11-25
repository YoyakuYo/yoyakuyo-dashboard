"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/apiClient";
import { useTranslations } from "next-intl";

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
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.preferredLanguage) {
          setPreferredLanguage(data.preferredLanguage);
        } else {
          setPreferredLanguage('en');
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          preferredLanguage,
        }),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          await res.json(); // Consume the response
          setMessage({ type: 'success', text: "Settings saved successfully!" });
          setTimeout(() => setMessage(null), 3000);
        } else {
          // Non-JSON response - try to read as text
          const text = await res.text();
          console.warn('Non-JSON response from server:', text);
          setMessage({ type: 'error', text: "Failed to save settings: Invalid response format." });
        }
      } else {
        // Handle error response
        const contentType = res.headers.get('content-type');
        let errorMessage = "Failed to save settings.";
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If JSON parse fails, use default message
          }
        } else {
          try {
            const errorText = await res.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // If text parse fails, use default message
          }
        }
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      // Check if it's a JSON parse error
      if (error?.message?.includes('JSON') || error?.message?.includes('Unexpected token')) {
        setMessage({ type: 'error', text: "Failed to save settings: Server returned invalid response." });
      } else {
        setMessage({ type: 'error', text: "Failed to save settings." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Language Preferences Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Account Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <p className="text-sm text-gray-600 font-mono">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          <p className="text-gray-600 mb-4">
            Manage how you receive notifications about bookings and messages.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">Email notifications for new bookings</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">Email notifications for customer messages</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">Push notifications (when available)</span>
            </label>
          </div>
        </div>

        {/* AI Settings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Assistant Settings</h2>
          <p className="text-gray-600 mb-4">
            Configure how the AI assistant responds to you and your customers.
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">Enable AI assistant for customer conversations</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-900">Auto-translate customer messages to my preferred language</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

