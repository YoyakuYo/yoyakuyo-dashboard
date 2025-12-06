"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import StaffSetupButton from "../components/StaffSetupButton";

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  is_super_admin: boolean;
}

type UserRole = 'super_admin' | 'shop_owner' | 'shop_staff' | 'user';

interface UserRoleInfo {
  role: UserRole;
  isSuperAdmin: boolean;
  isShopOwner: boolean;
  isShopStaff: boolean;
  ownedShopIds: string[];
}

export default function StaffDashboardPage() {
  const [activeTab, setActiveTab] = useState<"verification" | "complaints" | "shops" | "bookings" | "users">("verification");
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRoleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Load staff profile
        const staffResponse = await fetch(`${apiUrl}/staff/profile`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        let staffProfileData: StaffProfile | null = null;
        if (staffResponse.ok) {
          const data = await staffResponse.json();
          staffProfileData = data.profile;
          setStaffProfile(staffProfileData);
        }

        // Determine user role
        const roleInfo: UserRoleInfo = {
          role: 'user',
          isSuperAdmin: false,
          isShopOwner: false,
          isShopStaff: false,
          ownedShopIds: [],
        };

        // Check if super admin
        if (staffProfileData?.is_super_admin) {
          roleInfo.role = 'super_admin';
          roleInfo.isSuperAdmin = true;
        } else {
          // Check if shop owner
          const { data: ownedShops } = await supabase
            .from("shops")
            .select("id")
            .eq("owner_user_id", user.id);

          if (ownedShops && ownedShops.length > 0) {
            roleInfo.role = 'shop_owner';
            roleInfo.isShopOwner = true;
            roleInfo.ownedShopIds = ownedShops.map(s => s.id);
          } else {
            // Check if shop staff
            const { data: shopStaff } = await supabase
              .from("shop_staff")
              .select("shop_id")
              .eq("user_id", user.id);

            if (shopStaff && shopStaff.length > 0) {
              roleInfo.role = 'shop_staff';
              roleInfo.isShopStaff = true;
              roleInfo.ownedShopIds = shopStaff.map(s => s.shop_id);
            }
          }
        }

        setUserRole(roleInfo);
      } catch (error) {
        console.error("Error loading user role:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not staff, show setup button
  if (!staffProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Access Required</h1>
            <p className="text-gray-600 mb-4">
              You need a staff profile to access this dashboard. Click the button below to create one.
            </p>
            <StaffSetupButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              {staffProfile && (
                <p className="text-sm text-gray-600 mt-1">
                  {staffProfile.full_name} {staffProfile.is_super_admin && "(Super Admin)"}
                </p>
              )}
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "verification", label: "Shop Verification", allowedRoles: ['super_admin', 'shop_owner', 'shop_staff'] },
              { id: "complaints", label: "Complaints", allowedRoles: ['super_admin', 'shop_owner', 'shop_staff'] },
              { id: "shops", label: "Shop Control", allowedRoles: ['shop_owner', 'shop_staff'] }, // BLOCKED for super_admin
              { id: "bookings", label: "Bookings & Calendar", allowedRoles: ['super_admin', 'shop_owner', 'shop_staff'] },
              { id: "users", label: "Users & Owners", allowedRoles: ['super_admin'] },
            ]
            .filter(tab => !userRole || tab.allowedRoles.includes(userRole.role))
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "verification" && <ShopVerificationModule />}
        {activeTab === "complaints" && <ComplaintsModule />}
        {activeTab === "shops" && (
          userRole?.isSuperAdmin ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                <p className="text-gray-600 mb-2">Admins cannot edit shop data directly.</p>
                <p className="text-sm text-gray-500">Shop owners must manage their own shops through the owner dashboard.</p>
              </div>
            </div>
          ) : (
            <ShopControlModule userRole={userRole} />
          )
        )}
        {activeTab === "bookings" && <BookingsModule userRole={userRole} />}
        {activeTab === "users" && <UsersModule />}
      </main>
    </div>
  );
}

// ============================================================================
// MODULE A: SHOP VERIFICATION CONTROL
// ============================================================================
function ShopVerificationModule() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    claim_status: "all",
    verification_status: "all",
    search: "",
  });
  const [selectedShop, setSelectedShop] = useState<any | null>(null);

  useEffect(() => {
    loadShops();
  }, [filters]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const params = new URLSearchParams();
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.claim_status !== "all") params.set("claim_status", filters.claim_status);
      if (filters.verification_status !== "all") params.set("verification_status", filters.verification_status);
      if (filters.search) params.set("search", filters.search);

      const response = await fetch(`${apiUrl}/staff/shops?${params.toString()}`, {
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error("Error loading shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (shopId: string) => {
    if (!confirm("Approve this shop? This will enable booking, AI, and calendar.")) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shopId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ admin_note: "Approved by staff" }),
      });

      if (response.ok) {
        alert("Shop approved successfully!");
        loadShops();
        setSelectedShop(null);
      } else {
        alert("Failed to approve shop");
      }
    } catch (error) {
      console.error("Error approving shop:", error);
      alert("Error approving shop");
    }
  };

  const handleReject = async (shopId: string, reason: string) => {
    if (!reason) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shopId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert("Shop rejected");
        loadShops();
        setSelectedShop(null);
      } else {
        alert("Failed to reject shop");
      }
    } catch (error) {
      console.error("Error rejecting shop:", error);
      alert("Error rejecting shop");
    }
  };

  const handleDelete = async (shopId: string, shopName: string) => {
    if (!confirm(`Are you sure you want to delete "${shopName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shopId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        alert(`Shop "${shopName}" deleted successfully`);
        loadShops();
        setSelectedShop(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete shop: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting shop:", error);
      alert("Error deleting shop");
    }
  };

  if (selectedShop) {
    return (
      <ShopDetailView
        shop={selectedShop}
        onBack={() => setSelectedShop(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Shops</option>
          <option value="unclaimed">Unclaimed</option>
          <option value="claimed">Claimed</option>
        </select>
        <select
          value={filters.verification_status}
          onChange={(e) => setFilters({ ...filters, verification_status: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="not_submitted">Not Submitted</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="text"
          placeholder="Search shops..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                    <div className="text-sm text-gray-500">{shop.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.owner_profiles?.name || shop.users?.email || "Unclaimed"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      shop.claim_status === "approved" ? "bg-green-100 text-green-800" :
                      shop.claim_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {shop.claim_status || "unclaimed"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      shop.verification_status === "approved" ? "bg-green-100 text-green-800" :
                      shop.verification_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      shop.verification_status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {shop.verification_status === "not_submitted" ? "Not submitted" :
                       shop.verification_status === "pending" ? "Pending" :
                       shop.verification_status === "approved" ? "Approved" :
                       shop.verification_status === "rejected" ? "Rejected" :
                       shop.verification_status || "Not submitted"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedShop(shop)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {/* Only show approve/reject actions for pending shops */}
                      {shop.verification_status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(shop.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason) handleReject(shop.id, reason);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(shop.id, shop.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ShopDetailView({ shop, onBack, onApprove, onReject, onDelete }: any) {
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
        ← Back to list
      </button>
      <h2 className="text-2xl font-bold mb-4">{shop.name}</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Address</p>
          <p className="font-medium">{shop.address}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Owner</p>
          <p className="font-medium">{shop.owner_profiles?.name || shop.profiles?.email || "Unclaimed"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium">{shop.claim_status || "unclaimed"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Verification</p>
          <p className="font-medium">
            {shop.verification_status === "not_submitted" ? "Not submitted" :
             shop.verification_status === "pending" ? "Pending" :
             shop.verification_status === "approved" ? "Approved" :
             shop.verification_status === "rejected" ? "Rejected" :
             shop.verification_status || "Not submitted"}
          </p>
        </div>
      </div>

      {shop.shop_claim_requests && shop.shop_claim_requests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Claim Documents</h3>
          {shop.shop_claim_requests.map((claim: any) => (
            <div key={claim.id} className="border p-4 rounded mb-2">
              <p>Claimant: {claim.claimant_name} ({claim.claimant_email})</p>
              {claim.shop_claim_files && claim.shop_claim_files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Files:</p>
                  {claim.shop_claim_files.map((file: any) => (
                    <a key={file.id} href={file.file_path} target="_blank" className="text-blue-600 hover:underline block">
                      {file.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Only show approve/reject actions for pending shops */}
      {shop.verification_status === "pending" && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => onApprove(shop.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Approve Shop
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => onReject(shop.id, rejectReason)}
              className="mt-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reject Shop
            </button>
          </div>
        </div>
      )}

      {shop.verification_status !== "pending" && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            {shop.verification_status === "not_submitted" 
              ? "This shop has not submitted a verification request yet."
              : shop.verification_status === "approved"
              ? "This shop has been approved."
              : shop.verification_status === "rejected"
              ? "This shop has been rejected."
              : "No verification actions available for this shop."}
          </p>
        </div>
      )}

      {onDelete && (
        <div className="flex gap-4">
          <button
            onClick={() => onDelete(shop.id, shop.name)}
            className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
          >
            Delete Shop
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODULE B: COMPLAINTS / SUPPORT CENTER
// ============================================================================
function ComplaintsModule() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`${apiUrl}/staff/complaints?${params.toString()}`, {
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error("Error loading complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetailView
        complaint={selectedComplaint}
        onBack={() => {
          setSelectedComplaint(null);
          loadComplaints();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {complaint.users?.email || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {complaint.shops?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {complaint.message.substring(0, 100)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      complaint.status === "resolved" ? "bg-green-100 text-green-800" :
                      complaint.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComplaintDetailView({ complaint, onBack }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [complaint.id]);

  const loadMessages = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/complaints/${complaint.id}`, {
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/complaints/${complaint.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        setNewMessage("");
        loadMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const resolveComplaint = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/complaints/${complaint.id}/resolve`, {
        method: "PUT",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        alert("Complaint resolved");
        onBack();
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
        ← Back to list
      </button>
      <h2 className="text-2xl font-bold mb-4">Complaint #{complaint.id.substring(0, 8)}</h2>
      <div className="mb-6">
        <p className="text-sm text-gray-500">User</p>
        <p className="font-medium">{complaint.users?.email || "Unknown"}</p>
        <p className="text-sm text-gray-500 mt-2">Shop</p>
        <p className="font-medium">{complaint.shops?.name || "N/A"}</p>
        <p className="text-sm text-gray-500 mt-2">Initial Message</p>
        <p className="font-medium">{complaint.message}</p>
      </div>

      <div className="border-t pt-6 mb-6">
        <h3 className="font-semibold mb-4">Conversation</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`p-4 rounded-lg ${
              msg.sender_type === "staff" ? "bg-blue-50 ml-8" : "bg-gray-50 mr-8"
            }`}>
              <p className="text-sm font-medium">{msg.staff_profiles?.full_name || msg.users?.email || "User"}</p>
              <p className="mt-1">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Type your reply..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
        <button
          onClick={resolveComplaint}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Mark Resolved
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE C: SHOP CONTROL (OWNERS ONLY)
// ============================================================================
function ShopControlModule({ userRole }: { userRole: UserRoleInfo | null }) {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [editingService, setEditingService] = useState<any | null>(null);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error("Error loading shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadShopServices = async (shopId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shopId}/services`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const handleShopSelect = (shop: any) => {
    setSelectedShop(shop);
    loadShopServices(shop.id);
  };

  const handleUpdateShop = async (field: string, value: any) => {
    if (!selectedShop) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${selectedShop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        alert("Shop updated successfully");
        loadShops();
        const data = await response.json();
        setSelectedShop(data.shop);
      }
    } catch (error) {
      console.error("Error updating shop:", error);
    }
  };

  const handleCreateService = async (serviceData: any) => {
    if (!selectedShop) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${selectedShop.id}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        alert("Service created");
        loadShopServices(selectedShop.id);
        setEditingService(null);
      }
    } catch (error) {
      console.error("Error creating service:", error);
    }
  };

  const handleUpdateService = async (serviceId: string, serviceData: any) => {
    if (!selectedShop) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${selectedShop.id}/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        alert("Service updated");
        loadShopServices(selectedShop.id);
        setEditingService(null);
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Delete this service?")) return;
    if (!selectedShop) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${selectedShop.id}/services/${serviceId}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        alert("Service deleted");
        loadShopServices(selectedShop.id);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  if (selectedShop) {
    return (
      <ShopControlDetail
        shop={selectedShop}
        services={services}
        onBack={() => setSelectedShop(null)}
        onUpdateShop={handleUpdateShop}
        onCreateService={handleCreateService}
        onUpdateService={handleUpdateService}
        onDeleteService={handleDeleteService}
        editingService={editingService}
        setEditingService={setEditingService}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Shop Control</h2>
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.owner_profiles?.name || "Unclaimed"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.verification_status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleShopSelect(shop)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Control
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ShopControlDetail({
  shop,
  services,
  onBack,
  onUpdateShop,
  onCreateService,
  onUpdateService,
  onDeleteService,
  editingService,
  setEditingService,
}: any) {
  const [shopData, setShopData] = useState({
    name: shop.name || "",
    description: shop.description || "",
    address: shop.address || "",
    phone: shop.phone || "",
    email: shop.email || "",
    website: shop.website || "",
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
        ← Back to list
      </button>
      <h2 className="text-2xl font-bold mb-4">Control: {shop.name}</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
          <input
            type="text"
            value={shopData.name}
            onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
            onBlur={() => onUpdateShop("name", shopData.name)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={shopData.address}
            onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
            onBlur={() => onUpdateShop("address", shopData.address)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={shopData.phone}
            onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
            onBlur={() => onUpdateShop("phone", shopData.phone)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={shopData.email}
            onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
            onBlur={() => onUpdateShop("email", shopData.email)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={shopData.description}
            onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
            onBlur={() => onUpdateShop("description", shopData.description)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Services & Prices</h3>
          <button
            onClick={() => setEditingService({})}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Service
          </button>
        </div>

        {editingService && (
          <ServiceEditForm
            service={editingService}
            onSave={(data: { name: string; description: string; price: string | number; duration: number; category: string }) => {
              if (editingService.id) {
                onUpdateService(editingService.id, data);
              } else {
                onCreateService(data);
              }
            }}
            onCancel={() => setEditingService(null)}
          />
        )}

        <div className="space-y-2">
          {services.map((service: { id: string; name: string; price: number; duration: number; description?: string; category?: string }) => (
            <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-gray-500">¥{service.price} • {service.duration} min</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingService(service)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteService(service.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceEditForm({ service, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: service.name || "",
    description: service.description || "",
    price: service.price || "",
    duration: service.duration || 60,
    category: service.category || "",
  });

  return (
    <div className="mb-4 p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Service Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (¥)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={2}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSave(formData)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE D: BOOKINGS & CALENDAR
// ============================================================================
function BookingsModule({ userRole }: { userRole: UserRoleInfo | null }) {
  const isReadOnly = userRole?.isSuperAdmin || false;
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error("Error loading shops:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (shopId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shopId}/bookings`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  if (selectedShop) {
    return (
      <ShopBookingsView
        shop={selectedShop}
        bookings={bookings}
        onBack={() => setSelectedShop(null)}
        onLoadBookings={() => loadBookings(selectedShop.id)}
        isReadOnly={isReadOnly}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bookings & Calendar Control</h2>
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.owner_profiles?.name || "Unclaimed"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedShop(shop);
                        loadBookings(shop.id);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Calendar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ShopBookingsView(props: any) {
  const { shop, bookings, onBack, onLoadBookings, isReadOnly = false } = props;
  const readOnly = isReadOnly;
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    customer_email: "",
    date: "",
    time_slot: "",
    notes: "",
  });

  const handleCreateBooking = async () => {
    if (!newBooking.customer_name || !newBooking.date || !newBooking.time_slot) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shop.id}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(newBooking),
      });

      if (response.ok) {
        alert("Booking created");
        setNewBooking({ customer_name: "", customer_email: "", date: "", time_slot: "", notes: "" });
        onLoadBookings();
      }
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const handleUpdateBooking = async (bookingId: string, status: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        alert("Booking updated");
        onLoadBookings();
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Delete this booking?")) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        alert("Booking deleted");
        onLoadBookings();
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
        ← Back to list
      </button>
      <h2 className="text-2xl font-bold mb-4">Calendar: {shop.name}</h2>

      {readOnly && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Read-Only Mode:</strong> You can view bookings but cannot create, modify, or cancel them.
          </p>
        </div>
      )}

      {!readOnly && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4">Create Manual Booking</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Customer Name *"
              value={newBooking.customer_name}
              onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Customer Email"
              value={newBooking.customer_email}
              onChange={(e) => setNewBooking({ ...newBooking, customer_email: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={newBooking.date}
              onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="time"
              value={newBooking.time_slot}
              onChange={(e) => setNewBooking({ ...newBooking, time_slot: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Notes"
              value={newBooking.notes}
              onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleCreateBooking}
              className="col-span-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Booking
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-4">Existing Bookings</h3>
        <div className="space-y-2">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{booking.customer_name}</p>
                <p className="text-sm text-gray-500">
                  {booking.date} at {booking.time_slot} • {booking.status}
                </p>
              </div>
              <div className="flex gap-2">
                {readOnly ? (
                  <span className="px-3 py-1 text-sm text-gray-500 italic">Read-only</span>
                ) : (
                  <>
                    <select
                      value={booking.status}
                      onChange={(e) => handleUpdateBooking(booking.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE E: USERS & OWNERS
// ============================================================================
function UsersModule() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const response = await fetch(`${apiUrl}/staff/users?${params.toString()}`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/users/${userId}`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const handleSuspendShop = async (shopId: string) => {
    if (!confirm("Suspend this shop? This will disable booking.")) return;

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${apiUrl}/staff/shops/${shopId}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ reason: "Suspended by staff" }),
      });

      if (response.ok) {
        alert("Shop suspended");
        if (selectedUser) loadUserDetails(selectedUser.user.id);
      }
    } catch (error) {
      console.error("Error suspending shop:", error);
    }
  };

  if (selectedUser) {
    return (
      <UserDetailView
        userData={selectedUser}
        onBack={() => setSelectedUser(null)}
        onSuspendShop={handleSuspendShop}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.full_name || user.name || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'shop_owner' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'shop_staff' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.linked_shop_id ? (
                      <span className="text-blue-600">{user.linked_shop_id.substring(0, 8)}...</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.verification_status ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                        user.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        user.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.verification_status}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.account_status === 'active' ? 'bg-green-100 text-green-800' :
                      user.account_status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.account_status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => loadUserDetails(user.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserDetailView({ userData, onBack, onSuspendShop }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
        ← Back to list
      </button>
      <h2 className="text-2xl font-bold mb-4">User: {userData.user?.email}</h2>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">User Info</h3>
        <p>Email: {userData.user?.email}</p>
        <p>Name: {userData.user?.full_name || "N/A"}</p>
      </div>

      {userData.shops && userData.shops.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Owned Shops</h3>
          <div className="space-y-2">
            {userData.shops.map((shop: any) => (
              <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{shop.name}</p>
                  <p className="text-sm text-gray-500">Status: {shop.verification_status}</p>
                </div>
                <button
                  onClick={() => onSuspendShop(shop.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Suspend Shop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {userData.bookings && userData.bookings.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Bookings</h3>
          <div className="space-y-2">
            {userData.bookings.slice(0, 10).map((booking: any) => (
              <div key={booking.id} className="p-4 border rounded-lg">
                <p className="font-medium">{booking.customer_name}</p>
                <p className="text-sm text-gray-500">
                  {booking.date} at {booking.time_slot} • {booking.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

