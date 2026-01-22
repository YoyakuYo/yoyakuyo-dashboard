// Shop management table component
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Shop {
  id: string;
  name: string;
  address: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
  owner_user_id: string | null;
}

interface ShopManagementTableProps {
  shops: Shop[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ShopManagementTable({
  shops,
  loading,
  onRefresh,
}: ShopManagementTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const handleVerify = async (shopId: string) => {
    try {
      setProcessingId(shopId);
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_verified: true }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || t("admin.verifyFailed"));
      }
    } catch (error: any) {
      console.error("Error verifying shop:", error);
      alert(error.message || t("admin.verifyFailed"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleHide = async (shopId: string, hide: boolean) => {
    try {
      setProcessingId(shopId);
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_hidden: hide }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || t("admin.hideFailed"));
      }
    } catch (error: any) {
      console.error("Error hiding shop:", error);
      alert(error.message || t("admin.hideFailed"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm(t("admin.confirmDeleteShop"))) {
      return;
    }

    try {
      setProcessingId(shopId);
      const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUserId || "",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        onRefresh();
        alert(t("admin.shopDeleted"));
      } else {
        const error = await response.json();
        alert(error.error || t("admin.deleteFailed"));
      }
    } catch (error: any) {
      console.error("Error deleting shop:", error);
      alert(error.message || t("admin.deleteFailed"));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t("admin.noShopsFound")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("myShop.shopName")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("myShop.address")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("admin.status")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("common.date")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {shops.map((shop) => (
            <tr key={shop.id} className={shop.is_hidden ? "bg-gray-50" : ""}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <Link
                  href={`/admin/shops/${shop.id}`}
                  className="text-blue-600 hover:text-blue-900"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/admin/shops/${shop.id}`);
                  }}
                >
                  {shop.name}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {shop.address || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex flex-col gap-1">
                  {shop.is_verified ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 w-fit">
                      {t("admin.verified")}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 w-fit">
                      {t("admin.unverified")}
                    </span>
                  )}
                  {shop.is_hidden && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 w-fit">
                      {t("admin.hidden")}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(shop.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col gap-2">
                  {!shop.is_verified && (
                    <button
                      onClick={() => handleVerify(shop.id)}
                      disabled={processingId === shop.id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50 text-left"
                    >
                      {processingId === shop.id
                        ? t("common.loading")
                        : t("admin.verify")}
                    </button>
                  )}
                  <button
                    onClick={() => handleHide(shop.id, !shop.is_hidden)}
                    disabled={processingId === shop.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-left"
                  >
                    {processingId === shop.id
                      ? t("common.loading")
                      : shop.is_hidden
                      ? t("admin.unhide")
                      : t("admin.hide")}
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    disabled={processingId === shop.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 text-left"
                  >
                    {processingId === shop.id
                      ? t("common.loading")
                      : t("common.delete")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

