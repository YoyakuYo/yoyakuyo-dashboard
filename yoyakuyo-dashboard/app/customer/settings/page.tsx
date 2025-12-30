"use client";

import { useEffect, useState } from "react";
import { useCustomAuth } from "@/lib/useCustomAuth";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";
import PushNotificationButton from "@/app/components/PushNotificationButton";

export default function CustomerSettingsPage() {
  const { user } = useCustomAuth();
  const t = useTranslations();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address_line1: "",
    address_line2: "",
    city: "",
    prefecture: "",
    postal_code: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    
    // Try to find existing profile by customer_auth_id
    let { data, error } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("customer_auth_id", user.id)
      .maybeSingle();

    // If no profile exists, create one using the database function
    if (error || !data) {
      console.log("Profile not found, creating new profile...");
      // Use the database function to create profile (bypasses RLS)
      const { data: profileId, error: createError } = await supabase
        .rpc('create_customer_profile', {
          p_customer_auth_id: user.id,
          p_email: user.email || "",
          p_name: user.name || user.email?.split('@')[0] || "Customer",
          p_phone: null
        });

      if (createError) {
        console.error("Error creating profile:", createError);
        setMessage(`Error: ${createError.message}`);
        setLoading(false);
        return;
      }

      if (profileId) {
        // Fetch the newly created profile
        const { data: newProfile } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (newProfile) {
          data = newProfile;
        } else {
          console.error("Error fetching newly created profile");
          setMessage("Failed to fetch newly created profile");
          setLoading(false);
          return;
        }
      } else {
        console.error("No profile ID returned from create function");
        setMessage("Failed to create profile");
        setLoading(false);
        return;
      }
    }

    if (data) {
      setProfile({
        full_name: data.full_name || data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth || "",
        address_line1: data.address_line1 || "",
        address_line2: data.address_line2 || "",
        city: data.city || "",
        prefecture: data.prefecture || "",
        postal_code: data.postal_code || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate full_name is not empty
    if (!profile.full_name.trim()) {
      setMessage(t('common.error') + ': ' + t('common.name') + ' ' + t('common.required'));
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("customer_profiles")
      .update({
        full_name: profile.full_name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim() || null,
        date_of_birth: profile.date_of_birth || null,
        address_line1: profile.address_line1.trim() || null,
        address_line2: profile.address_line2.trim() || null,
        city: profile.city.trim() || null,
        prefecture: profile.prefecture.trim() || null,
        postal_code: profile.postal_code.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("customer_auth_id", user.id);

    if (error) {
      setMessage(t('common.error') + ': ' + error.message);
    } else {
      setMessage(t('common.success') + ': ' + t('customer.profile') + ' ' + t('common.update') + 'd');
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('nav.settings')}</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('customer.profileInformation')}</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">{t('common.email')} {t('common.cannotBeChanged')}</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
              {t('customer.dateOfBirth')}
            </label>
            <input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth}
              onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('customer.addressInformation')}</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customer.addressLine1')}
                </label>
                <input
                  id="address_line1"
                  type="text"
                  value={profile.address_line1}
                  onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  id="address_line2"
                  type="text"
                  value={profile.address_line2}
                  onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.city')}
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="prefecture" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('browse.prefecture')}
                  </label>
                  <input
                    id="prefecture"
                    type="text"
                    value={profile.prefecture}
                    onChange={(e) => setProfile({ ...profile, prefecture: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('myShop.zipCode')}
                </label>
                <input
                  id="postal_code"
                  type="text"
                  value={profile.postal_code}
                  onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes("Error")
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? t('common.updating') : t('common.save')}
          </button>
        </form>

        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Push Notifications
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Receive push notifications for booking confirmations, messages, and updates even when the app is closed.
              </p>
              <PushNotificationButton userType="customer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

