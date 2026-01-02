// app/owner/ai-settings/page.tsx
// AI Settings Page - Simple toggles only

"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface Shop {
  id: string;
  name?: string;
  ai_enabled?: boolean;
  booking_enabled?: boolean;
  auto_confirm?: boolean;
  auto_reply?: boolean;
}

export default function AISettingsPage() {
  const { user } = useAuth();
  const t = useTranslations();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadShop();
    }
  }, [user]);

  const loadShop = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setShop(data.shops[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (field: string, value: boolean) => {
    if (!shop?.id || !user?.id) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/shops/${shop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        await loadShop();
      } else {
        alert(t('aiSettings.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      alert(t('aiSettings.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">{t('aiSettings.noShopFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{t('aiSettings.title')}</h1>
            <p className="text-gray-600 mt-2">{t('aiSettings.subtitle')}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* AI ON/OFF */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">{t('aiSettings.aiAssistant')}</h3>
                <p className="text-sm text-gray-600">{t('aiSettings.aiAssistantDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shop.ai_enabled || false}
                  onChange={(e) => updateSetting('ai_enabled', e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Auto-Confirm */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">{t('aiSettings.autoConfirm')}</h3>
                <p className="text-sm text-gray-600">{t('aiSettings.autoConfirmDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shop.auto_confirm || false}
                  onChange={(e) => updateSetting('auto_confirm', e.target.checked)}
                  disabled={saving || !shop.ai_enabled}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  shop.ai_enabled 
                    ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600' 
                    : 'bg-gray-100 cursor-not-allowed'
                }`}></div>
              </label>
            </div>

            {/* Auto-Reply */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">{t('aiSettings.autoReply')}</h3>
                <p className="text-sm text-gray-600">{t('aiSettings.autoReplyDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shop.auto_reply || false}
                  onChange={(e) => updateSetting('auto_reply', e.target.checked)}
                  disabled={saving || !shop.ai_enabled}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  shop.ai_enabled 
                    ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600' 
                    : 'bg-gray-100 cursor-not-allowed'
                }`}></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

