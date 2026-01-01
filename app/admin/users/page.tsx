// Admin user management page
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/apiClient";
import { useAdminAuth } from "@/lib/useAdminAuth";
import UserManagementTable from "@/app/components/admin/UserManagementTable";

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  user_type: "owner" | "customer";
  role?: string;
}

export default function AdminUsersPage() {
  const t = useTranslations();
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    role: "",
    banned: "",
    search: "",
  });

  useEffect(() => {
    if (admin?.id) {
      loadUsers();
    }
  }, [admin, page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (filters.role) params.append("role", filters.role);
      if (filters.banned) params.append("banned", filters.banned);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`${apiUrl}/admin/users?${params}`, {
        headers: {
          "x-user-id": admin?.id || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("admin.users")}
        </h1>
        <p className="text-gray-600">{t("admin.manageUsers")}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByRole")}
            </label>
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters({ ...filters, role: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.allRoles")}</option>
              <option value="owner">{t("admin.owner")}</option>
              <option value="customer">{t("admin.customer")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.filterByStatus")}
            </label>
            <select
              value={filters.banned}
              onChange={(e) =>
                setFilters({ ...filters, banned: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t("admin.allStatuses")}</option>
              <option value="false">{t("admin.active")}</option>
              <option value="true">{t("admin.banned")}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("common.search")}
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder={t("admin.searchUsers")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <UserManagementTable
          users={users}
          loading={loading}
          onRefresh={loadUsers}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.previous")}
          </button>
          <span className="text-gray-600">
            {t("admin.page")} {page} {t("admin.of")} {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}

