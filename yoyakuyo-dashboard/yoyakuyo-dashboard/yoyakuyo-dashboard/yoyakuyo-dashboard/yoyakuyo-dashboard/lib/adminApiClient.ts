// Admin API client with typed helper functions
import { apiUrl } from "./apiClient";
import { getUserId } from "./apiClient";

export interface PlatformStats {
  totals: {
    owners: number;
    customers: number;
    shops: number;
    bookings: number;
    revenue: number;
  };
  recent: {
    owners: number;
    customers: number;
    shops: number;
    bookings: number;
  };
  growth: Array<{
    date: string;
    owners: number;
    customers: number;
  }>;
}

export interface User {
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

export interface Shop {
  id: string;
  name: string;
  address: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  created_at: string;
  owner_user_id: string | null;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ShopsResponse {
  shops: Shop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get platform statistics
 */
export async function getAdminStats(): Promise<PlatformStats> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${apiUrl}/admin/stats`, {
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch stats" }));
    throw new Error(error.error || "Failed to fetch stats");
  }

  return response.json();
}

/**
 * Get users with pagination and filters
 */
export async function getUsers(params: {
  page?: number;
  limit?: number;
  role?: string;
  banned?: string;
  search?: string;
}): Promise<UsersResponse> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.role) queryParams.append("role", params.role);
  if (params.banned) queryParams.append("banned", params.banned);
  if (params.search) queryParams.append("search", params.search);

  const response = await fetch(`${apiUrl}/admin/users?${queryParams}`, {
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch users" }));
    throw new Error(error.error || "Failed to fetch users");
  }

  return response.json();
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: string, userType?: string): Promise<User> {
  const currentUserId = await getUserId();
  if (!currentUserId) {
    throw new Error("User not authenticated");
  }

  const queryParams = new URLSearchParams();
  if (userType) queryParams.append("type", userType);

  const response = await fetch(
    `${apiUrl}/admin/users/${userId}${queryParams.toString() ? `?${queryParams}` : ""}`,
    {
      headers: {
        "x-user-id": currentUserId,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch user" }));
    throw new Error(error.error || "Failed to fetch user");
  }

  return response.json();
}

/**
 * Update a user (ban/unban, edit details)
 */
export async function updateUser(
  userId: string,
  data: {
    is_banned?: boolean;
    banned_reason?: string;
    name?: string;
    email?: string;
    user_type: "owner" | "customer";
  }
): Promise<User> {
  const currentUserId = await getUserId();
  if (!currentUserId) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
      "x-user-id": currentUserId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update user" }));
    throw new Error(error.error || "Failed to update user");
  }

  return response.json();
}

/**
 * Get shops with pagination and filters
 */
export async function getShops(params: {
  page?: number;
  limit?: number;
  verified?: string;
  hidden?: string;
  search?: string;
}): Promise<ShopsResponse> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.verified) queryParams.append("verified", params.verified);
  if (params.hidden) queryParams.append("hidden", params.hidden);
  if (params.search) queryParams.append("search", params.search);

  const response = await fetch(`${apiUrl}/admin/shops?${queryParams}`, {
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch shops" }));
    throw new Error(error.error || "Failed to fetch shops");
  }

  return response.json();
}

/**
 * Get a single shop by ID
 */
export async function getShop(shopId: string): Promise<Shop> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch shop" }));
    throw new Error(error.error || "Failed to fetch shop");
  }

  return response.json();
}

/**
 * Update a shop (verify, hide, edit details)
 */
export async function updateShop(
  shopId: string,
  data: {
    is_verified?: boolean;
    is_hidden?: boolean;
    name?: string;
    address?: string;
    [key: string]: any;
  }
): Promise<Shop> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
    method: "PATCH",
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update shop" }));
    throw new Error(error.error || "Failed to update shop");
  }

  return response.json();
}

/**
 * Delete a shop (soft delete)
 */
export async function deleteShop(shopId: string): Promise<{ message: string; shop: Shop }> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${apiUrl}/admin/shops/${shopId}`, {
    method: "DELETE",
    headers: {
      "x-user-id": userId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete shop" }));
    throw new Error(error.error || "Failed to delete shop");
  }

  return response.json();
}

