"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/apiClient";

export default function StaffSetupButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);

      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in first");
        return;
      }

      const response = await fetch(`${apiUrl}/staff/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Staff profile created! You can now access the Staff Dashboard.");
        // Reload page after 2 seconds to refresh navigation
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || "Failed to create staff profile");
      }
    } catch (err: any) {
      console.error("Error setting up staff profile:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800 mb-2">
        Need staff access? Click the button below to create your staff profile.
      </p>
      <button
        onClick={handleSetup}
        disabled={loading}
        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating..." : "Create Staff Profile"}
      </button>
      {message && (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

