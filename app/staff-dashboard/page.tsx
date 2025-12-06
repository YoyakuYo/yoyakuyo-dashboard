// Staff Dashboard - Rebuilt from Scratch
// Tabs: Shop Verification, Complaints, Bookings & Calendar, Users & Owners, Messages

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';

type Tab = 'verification' | 'complaints' | 'bookings' | 'users' | 'messages';

interface Claim {
  id: string;
  shop_name: string;
  owner_name: string;
  country: string;
  status: string;
  created_at: string;
}

interface Complaint {
  id: string;
  shop_id?: string;
  user_id: string;
  title?: string;
  message: string;
  status: string;
  created_at: string;
  shop?: { id: string; name: string };
  user?: { id: string; email: string; full_name?: string };
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  shop?: { id: string; name: string };
  customer?: { id: string; email: string; full_name?: string };
  service?: { id: string; name: string };
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  shop?: { id: string; name: string; verification_status?: string };
  claim_status?: string;
}

interface Thread {
  id: string;
  shop_id: string;
  owner_id: string;
  last_message_at: string;
  shop?: { id: string; name: string };
  owner?: { id: string; full_name?: string };
}

export default function StaffDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('verification');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [claimDetails, setClaimDetails] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadData();
    }
  }, [user, authLoading, router, activeTab]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case 'verification':
          await loadClaims();
          break;
        case 'complaints':
          await loadComplaints();
          break;
        case 'bookings':
          await loadBookings();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'messages':
          await loadThreads();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/claims?status=submitted,pending,resubmission_required`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const loadComplaints = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/complaints`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/bookings`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadUsers = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/users`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadThreads = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/messages/threads`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const loadClaimDetails = async (claimId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/claims/${claimId}`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setClaimDetails(data.claim);
        setSelectedClaim(claimId);
      }
    } catch (error) {
      console.error('Error loading claim details:', error);
    }
  };

  const handleApprove = async (claimId: string) => {
    if (!user?.id || !confirm('Are you sure you want to approve this claim?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/claims/${claimId}/approve`, {
        method: 'POST',
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        alert('Claim approved successfully');
        await loadClaims();
        setSelectedClaim(null);
        setClaimDetails(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to approve claim');
    }
  };

  const handleReject = async (claimId: string, staffNote: string) => {
    if (!user?.id || !confirm('Are you sure you want to reject this claim?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/claims/${claimId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ staff_note: staffNote }),
      });
      if (res.ok) {
        alert('Claim rejected successfully');
        await loadClaims();
        setSelectedClaim(null);
        setClaimDetails(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to reject claim');
    }
  };

  const handleRequestMoreInfo = async (claimId: string, staffNote: string) => {
    if (!user?.id || !staffNote.trim()) {
      alert('Please provide a note');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/staff/claims/${claimId}/request-more-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ staff_note: staffNote }),
      });
      if (res.ok) {
        alert('More information requested successfully');
        await loadClaims();
        setSelectedClaim(null);
        setClaimDetails(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to request more info');
    }
  };

  const handleComplaintStatusChange = async (complaintId: string, newStatus: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/staff/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadComplaints();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update complaint status');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Staff Dashboard</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'verification', label: 'Shop Verification' },
              { id: 'complaints', label: 'Complaints' },
              { id: 'bookings', label: 'Bookings & Calendar' },
              { id: 'users', label: 'Users & Owners' },
              { id: 'messages', label: 'Messages' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'verification' && (
            <VerificationTab
              claims={claims}
              selectedClaim={selectedClaim}
              claimDetails={claimDetails}
              onSelectClaim={loadClaimDetails}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestMoreInfo={handleRequestMoreInfo}
            />
          )}

          {activeTab === 'complaints' && (
            <ComplaintsTab
              complaints={complaints}
              onStatusChange={handleComplaintStatusChange}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab bookings={bookings} />
          )}

          {activeTab === 'users' && (
            <UsersTab users={users} />
          )}

          {activeTab === 'messages' && (
            <MessagesTab threads={threads} userId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// Verification Tab Component
function VerificationTab({
  claims,
  selectedClaim,
  claimDetails,
  onSelectClaim,
  onApprove,
  onReject,
  onRequestMoreInfo,
}: {
  claims: Claim[];
  selectedClaim: string | null;
  claimDetails: any;
  onSelectClaim: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  onRequestMoreInfo: (id: string, note: string) => void;
}) {
  const [actionNote, setActionNote] = useState('');

  if (selectedClaim && claimDetails) {
    return (
      <div className="p-6">
        <button
          onClick={() => {
            onSelectClaim('');
            setActionNote('');
          }}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to list
        </button>

        <h2 className="text-2xl font-bold mb-4">Claim Details</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Shop Information</h3>
            <p>Name: {claimDetails.shop?.name || 'N/A'}</p>
            <p>Address: {claimDetails.shop?.address || 'N/A'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Owner Information</h3>
            <p>Name: {claimDetails.owner?.full_name || 'N/A'}</p>
            <p>Country: {claimDetails.owner?.country || 'N/A'}</p>
            <p>Email: {claimDetails.owner?.company_email || 'N/A'}</p>
            <p>Phone: {claimDetails.owner?.company_phone || 'N/A'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Documents</h3>
            {claimDetails.documents && claimDetails.documents.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {claimDetails.documents.map((doc: any) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {doc.doc_type} - View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No documents uploaded</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="font-bold">{claimDetails.status}</p>
            {claimDetails.staff_note && (
              <p className="mt-2 text-sm text-gray-600">Note: {claimDetails.staff_note}</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Note (for reject or request more info)
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                placeholder="Enter note..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => onApprove(selectedClaim!)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(selectedClaim!, actionNote)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => onRequestMoreInfo(selectedClaim!, actionNote)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Request More Info
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Shop Verification</h2>
      
      {claims.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.shop_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.owner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No claims to review</p>
      )}
    </div>
  );
}

// Complaints Tab Component
function ComplaintsTab({
  complaints,
  onStatusChange,
}: {
  complaints: Complaint[];
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Complaints</h2>
      
      {complaints.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {complaint.shop?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {complaint.user?.full_name || complaint.user?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{complaint.title || 'No title'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={complaint.status}
                      onChange={(e) => onStatusChange(complaint.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No complaints</p>
      )}
    </div>
  );
}

// Bookings Tab Component
function BookingsTab({ bookings }: { bookings: Booking[] }) {
  const [shopFilter, setShopFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bookings & Calendar</h2>
      
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop ID</label>
          <input
            type="text"
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Filter by shop ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.booking_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.shop?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.customer?.full_name || booking.customer?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.service?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No bookings found</p>
      )}
    </div>
  );
}

// Users Tab Component
function UsersTab({ users }: { users: User[] }) {
  const [roleFilter, setRoleFilter] = useState('');

  const filteredUsers = roleFilter
    ? users.filter(u => u.role === roleFilter)
    : users;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Users & Owners</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All</option>
          <option value="owner">Owners</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.shop?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.claim_status || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No users found</p>
      )}
    </div>
  );
}

// Messages Tab Component
function MessagesTab({ threads, userId }: { threads: Thread[]; userId?: string }) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const loadMessages = async (threadId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/messages/${threadId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (threadId: string) => {
    if (!userId || !newMessage.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/messages/${threadId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        await loadMessages(threadId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="border-r pr-4">
          <h3 className="font-semibold mb-2">Threads</h3>
          {threads.length > 0 ? (
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => {
                    setSelectedThread(thread.id);
                    loadMessages(thread.id);
                  }}
                  className={`w-full text-left p-2 rounded ${
                    selectedThread === thread.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-sm">
                    {thread.shop?.name || 'Shop'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {thread.owner?.full_name || 'Owner'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No messages</p>
          )}
        </div>

        <div className="col-span-2">
          {selectedThread ? (
            <div className="space-y-4">
              <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded ${
                      msg.sender_role === 'staff' ? 'bg-blue-50 ml-auto' : 'bg-gray-50'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      sendMessage(selectedThread);
                    }
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Type a message..."
                />
                <button
                  onClick={() => sendMessage(selectedThread)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a thread to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
}
