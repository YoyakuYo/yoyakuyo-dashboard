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
  owner_email: string;
  country: string;
  status: string;
  rejection_reason?: string | null;
  failed_attempts: number;
  last_rejection_at?: string | null;
  created_at: string;
  updated_at: string;
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

interface Conversation {
  id: string;
  type: 'customer_owner' | 'owner_staff' | 'staff_customer';
  shop_id: string;
  customer_id?: string;
  owner_id?: string;
  staff_id?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  shop?: { id: string; name: string };
  customer?: { id: string; email?: string; full_name?: string };
  owner?: { id: string; email?: string; full_name?: string };
  staff?: { id: string; email?: string; full_name?: string };
}

export default function StaffDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('verification');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [claimDetails, setClaimDetails] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

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
          await loadClaims(statusFilter);
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
          await loadConversations();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async (statusFilter: string = 'pending') => {
    if (!user?.id) return;
    try {
      const url = statusFilter === 'all' 
        ? `${apiUrl}/api/staff/claims?status=all`
        : `${apiUrl}/api/staff/claims?status=${statusFilter}`;
      const res = await fetch(url, {
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

  const loadConversations = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/conversations`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Loaded conversations:', data.conversations?.length || 0, 'conversations');
        setConversations(data.conversations || []);
      } else {
        const errorText = await res.text();
        console.error('Failed to load conversations:', res.status, errorText);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
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
        await loadClaims(statusFilter || 'pending');
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
        await loadClaims(statusFilter || 'pending');
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
        await loadClaims(statusFilter || 'pending');
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
              onFilterChange={loadClaims}
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
            <MessagesTab conversations={conversations} userId={user?.id} onRefresh={loadConversations} />
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
  onFilterChange,
}: {
  claims: Claim[];
  selectedClaim: string | null;
  claimDetails: any;
  onSelectClaim: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  onRequestMoreInfo: (id: string, note: string) => void;
  onFilterChange: (status: string) => void;
}) {
  const [actionNote, setActionNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');

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
            <p>Nationality: {claimDetails.owner?.nationality || 'N/A'}</p>
            <p>Country of Residence: {claimDetails.owner?.country_of_residence || 'N/A'}</p>
            <p>Address: {claimDetails.owner?.address || 'N/A'}</p>
            <p>Email: {claimDetails.owner?.email || 'N/A'}</p>
            <p>Phone: {claimDetails.owner?.phone_number || 'N/A'}</p>
            <p>Role in Business: {claimDetails.owner?.role_in_business || 'N/A'}</p>
            <p>Position Title: {claimDetails.owner?.position_title || 'N/A'}</p>
            <p>Since When: {claimDetails.owner?.since_when ? new Date(claimDetails.owner.since_when).toLocaleDateString() : 'N/A'}</p>
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

            {(claimDetails.status === 'pending' || claimDetails.status === 'resubmission_required') && (
              <div className="flex gap-4">
                <button
                  onClick={() => onApprove(selectedClaim!)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    if (!actionNote.trim()) {
                      alert('Please provide a rejection reason');
                      return;
                    }
                    onReject(selectedClaim!, actionNote);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    if (!actionNote.trim()) {
                      alert('Please provide a note');
                      return;
                    }
                    onRequestMoreInfo(selectedClaim!, actionNote);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Request More Info
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    onFilterChange(newFilter);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Shop Verification</h2>
      
      {/* Status Filter */}
      <div className="mb-4 flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>
      
      {claims.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Decision</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {claims.map((claim) => (
                <tr key={claim.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.owner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.owner_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.shop_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                      claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      claim.status === 'pending' || claim.status === 'resubmission_required' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.failed_attempts || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {claim.last_rejection_at 
                      ? new Date(claim.last_rejection_at).toLocaleDateString()
                      : claim.updated_at 
                        ? new Date(claim.updated_at).toLocaleDateString()
                        : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onSelectClaim(claim.id)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Review
                    </button>
                    {claim.status === 'pending' || claim.status === 'resubmission_required' ? (
                      <>
                        <button
                          onClick={() => onApprove(claim.id)}
                          className="text-green-600 hover:text-green-800 mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(claim.id, '')}
                          className="text-red-600 hover:text-red-800"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No claims found</p>
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
function MessagesTab({ 
  conversations, 
  userId, 
  onRefresh 
}: { 
  conversations: Conversation[]; 
  userId?: string;
  onRefresh: () => void;
}) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableOwners, setAvailableOwners] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const loadMessages = async (conversationId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/conversations/${conversationId}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Loaded messages:', data.messages?.length || 0, 'messages');
        setMessages(data.messages || []);
      } else {
        const errorText = await res.text();
        console.error('Failed to load messages:', res.status, errorText);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (conversationId: string) => {
    if (!userId || !newMessage.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        await loadMessages(conversationId);
        onRefresh(); // Refresh conversation list to update unread counts
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loadAvailableOwners = async () => {
    if (!userId) return;
    setLoadingOwners(true);
    try {
      // Get all owners with their shops
      const res = await fetch(`${apiUrl}/api/staff/users?role=owner`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        // Format owners with shop info
        const ownersWithShops = (data.users || [])
          .filter((u: any) => u.role === 'owner' && u.shop)
          .map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            shop_id: u.shop?.id,
            shop_name: u.shop?.name,
          }));
        setAvailableOwners(ownersWithShops);
        console.log('Loaded available owners:', ownersWithShops.length);
      } else {
        console.error('Failed to load owners:', await res.text());
      }
    } catch (error) {
      console.error('Error loading owners:', error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const startNewConversation = async () => {
    if (!userId || !selectedShopId || !selectedOwnerId) {
      alert('Please select a shop and owner');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          type: 'owner_staff',
          shop_id: selectedShopId,
          owner_id: selectedOwnerId,
          staff_id: userId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation.id);
        await loadMessages(data.conversation.id);
        setShowNewConversation(false);
        setSelectedShopId(null);
        setSelectedOwnerId(null);
        onRefresh();
      } else {
        const errorText = await res.text();
        console.error('Failed to create conversation:', errorText);
        alert('Failed to start conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation');
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.type === 'customer_owner') {
      return conv.customer?.full_name || conv.customer?.email || 'Customer';
    } else if (conv.type === 'owner_staff') {
      return conv.owner?.full_name || conv.owner?.email || 'Owner';
    } else if (conv.type === 'staff_customer') {
      return conv.customer?.full_name || conv.customer?.email || 'Customer';
    }
    return 'Unknown';
  };

  useEffect(() => {
    if (showNewConversation) {
      loadAvailableOwners();
    }
  }, [showNewConversation, userId]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Messages</h2>
        <button
          onClick={() => setShowNewConversation(!showNewConversation)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showNewConversation ? 'Cancel' : '+ New Conversation'}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="border-r pr-4">
          <h3 className="font-semibold mb-2">Conversations</h3>
          {showNewConversation ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Shop</label>
                <select
                  value={selectedShopId || ''}
                  onChange={(e) => {
                    setSelectedShopId(e.target.value);
                    setSelectedOwnerId(null);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Choose a shop...</option>
                  {availableOwners.map((owner: any) => (
                    <option key={owner.shop_id} value={owner.shop_id}>
                      {owner.shop_name || `Shop ${owner.shop_id?.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedShopId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Select Owner</label>
                  <select
                    value={selectedOwnerId || ''}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Choose an owner...</option>
                    {availableOwners
                      .filter((o: any) => o.shop_id === selectedShopId)
                      .map((owner: any) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.full_name || owner.email || `Owner ${owner.id?.substring(0, 8)}`}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <button
                onClick={startNewConversation}
                disabled={!selectedShopId || !selectedOwnerId || loadingOwners}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <>
              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        loadMessages(conv.id);
                      }}
                      className={`w-full text-left p-2 rounded ${
                        selectedConversation === conv.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-sm">
                        {conv.shop?.name || 'Shop'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getConversationTitle(conv)}
                      </p>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">No conversations</p>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Start New Conversation
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="col-span-2">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                {(() => {
                  const conv = conversations.find(c => c.id === selectedConversation);
                  return (
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {conv?.shop?.name || 'Shop'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getConversationTitle(conv!)}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Messages Area */}
              <div className="bg-white border rounded-lg flex flex-col" style={{ height: '500px' }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_role === 'staff' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_role === 'staff'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-xs font-medium mb-1 opacity-80">
                            {msg.sender?.full_name || msg.sender?.email || msg.sender_role}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Message Input - ALWAYS VISIBLE when conversation is selected */}
                <div className="border-t p-4 bg-gray-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                          e.preventDefault();
                          sendMessage(selectedConversation);
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type a message..."
                      disabled={!selectedConversation}
                    />
                    <button
                      onClick={() => sendMessage(selectedConversation)}
                      disabled={!selectedConversation || !newMessage.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">No conversation selected</p>
                <p className="text-gray-400 text-sm mb-4">Select a conversation from the list or start a new one</p>
                {!showNewConversation && (
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start New Conversation
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
