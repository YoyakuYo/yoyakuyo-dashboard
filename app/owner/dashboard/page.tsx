// Owner Dashboard - Rebuilt from Scratch
// Tabs: Overview, My Shop, Bookings, Verification, Messages

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import Link from 'next/link';

type Tab = 'overview' | 'my-shop' | 'bookings' | 'verification' | 'messages';

interface Claim {
  id: string;
  shop_id: string;
  status: string;
  staff_note?: string;
  created_at: string;
  updated_at: string;
  shop?: {
    id: string;
    name: string;
    address?: string;
  };
}

interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  customer_name?: string;
  service_name?: string;
}

interface Thread {
  id: string;
  shop_id: string;
  last_message_at: string;
  shop?: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export default function OwnerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user?.id) {
      loadData();
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await Promise.all([
        loadClaims(),
        loadShop(),
        loadBookings(),
        loadThreads(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/my`, {
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

  const loadShop = async () => {
    if (!user?.id) return;
    try {
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
    }
  };

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/bookings?owner=true`, {
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

  const loadThreads = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/owner/messages/threads`, {
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentClaim = claims.find(c => 
    ['draft', 'submitted', 'pending', 'resubmission_required'].includes(c.status)
  ) || claims[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'my-shop', label: 'My Shop' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'verification', label: 'Verification' },
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
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              
              {currentClaim ? (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <h3 className="font-semibold text-blue-900 mb-2">Current Claim Status</h3>
                  <p className="text-blue-700">
                    Status: <span className="font-bold">{currentClaim.status}</span>
                  </p>
                  {currentClaim.shop && (
                    <p className="text-blue-700 mt-1">
                      Shop: {currentClaim.shop.name}
                    </p>
                  )}
                  {currentClaim.staff_note && (
                    <div className="mt-2 p-2 bg-white rounded">
                      <p className="text-sm text-gray-700">
                        <strong>Staff Note:</strong> {currentClaim.staff_note}
                      </p>
                    </div>
                  )}
                  <Link
                    href="/owner/claim"
                    className="mt-3 inline-block text-sm font-medium text-blue-800 hover:text-blue-900"
                  >
                    View Claim Details →
                  </Link>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <h3 className="font-semibold text-yellow-900 mb-2">No Active Claims</h3>
                  <p className="text-yellow-700 mb-3">
                    You don't have any active claims. Start by claiming a shop to get verified.
                  </p>
                  <Link
                    href="/owner/claim"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Claim a Shop
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Claims</p>
                  <p className="text-2xl font-bold mt-2">{claims.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold mt-2">{bookings.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Messages</p>
                  <p className="text-2xl font-bold mt-2">{threads.length}</p>
                </div>
              </div>

              {claims.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">All Claims</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {claims.map((claim) => (
                          <tr key={claim.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {claim.shop?.name || 'Unknown Shop'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                claim.status === 'pending' || claim.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {claim.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(claim.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href="/owner/claim"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-shop' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">My Shop</h2>
              {shop ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                    <p className="mt-1 text-gray-900">{shop.name}</p>
                  </div>
                  {shop.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-gray-900">{shop.address}</p>
                    </div>
                  )}
                  <Link
                    href="/owner/shop-profile"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Shop Profile
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No shop found</p>
                  <Link
                    href="/owner/claim"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Claim a Shop
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Bookings</h2>
              {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.booking_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.customer_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.service_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No bookings found</p>
              )}
            </div>
          )}

          {activeTab === 'verification' && (
            <VerificationTab claim={currentClaim} userId={user?.id} />
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
function VerificationTab({ claim, userId }: { claim?: Claim; userId?: string }) {
  const [step, setStep] = useState<'step1' | 'step2' | 'submit'>('step1');
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    country: '',
    address_line1: '',
    address_line2: '',
    city: '',
    prefecture: '',
    postal_code: '',
    company_phone: '',
    company_email: '',
  });
  const [documents, setDocuments] = useState<Array<{ doc_type: string; file_url: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (claim) {
      loadOwnerProfile();
      loadDocuments();
    }
  }, [claim, userId]);

  const loadOwnerProfile = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/owner/profiles`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setFormData({
            full_name: data.profile.full_name || '',
            date_of_birth: data.profile.date_of_birth || '',
            country: data.profile.country || '',
            address_line1: data.profile.address_line1 || '',
            address_line2: data.profile.address_line2 || '',
            city: data.profile.city || '',
            prefecture: data.profile.prefecture || '',
            postal_code: data.profile.postal_code || '',
            company_phone: data.profile.company_phone || '',
            company_email: data.profile.company_email || '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading owner profile:', error);
    }
  };

  const loadDocuments = async () => {
    if (!claim?.id || !userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/${claim.id}/documents`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim?.id || !userId) return;

    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/${claim.id}/step1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStep('step2');
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save profile');
      }
    } catch (error) {
      setError('Failed to save profile');
    }
  };

  const handleFileUpload = async (file: File, docType: string) => {
    if (!claim?.id || !userId) return;

    // Upload to Supabase Storage first
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${claim.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('verification-documents')
      .upload(fileName, file);

    if (uploadError) {
      setError('Failed to upload file');
      return;
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    // Save document reference
    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/${claim.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          doc_type: docType,
          file_url: publicUrl,
        }),
      });

      if (res.ok) {
        await loadDocuments();
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save document');
      }
    } catch (error) {
      setError('Failed to save document');
    }
  };

  const handleSubmit = async () => {
    if (!claim?.id || !userId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/${claim.id}/submit`, {
        method: 'POST',
        headers: { 'x-user-id': userId },
      });

      if (res.ok) {
        alert('Claim submitted successfully!');
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit claim');
        if (data.error_code) {
          setError(`${data.error}: ${data.error_code}`);
        }
      }
    } catch (error) {
      setError('Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (!claim) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Verification</h2>
        <p className="text-gray-600 mb-4">No active claim found.</p>
        <Link
          href="/owner/claim"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Claim Process
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Verification</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {step === 'step1' && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Step 1: Personal Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefecture *</label>
              <input
                type="text"
                value={formData.prefecture}
                onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Phone</label>
              <input
                type="tel"
                value={formData.company_phone}
                onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
              <input
                type="email"
                value={formData.company_email}
                onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save & Continue
          </button>
        </form>
      )}

      {step === 'step2' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Step 2: Documents</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Proof Document *
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'business_proof');
                }}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Document *
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'id_document');
                }}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Document (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'other');
                }}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {documents.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Uploaded Documents:</h4>
              <ul className="list-disc list-inside space-y-1">
                {documents.map((doc, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    {doc.doc_type} - {doc.file_url.substring(0, 50)}...
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep('step1')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('submit')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {step === 'submit' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Documents:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {documents.map((doc, idx) => (
                <li key={idx}>{doc.doc_type}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-gray-600">
              Total: {documents.length} document(s)
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('step2')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : claim.status === 'resubmission_required' ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        </div>
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
                    {thread.staff?.full_name || thread.staff?.email || 'Staff'}
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
                      msg.sender_role === 'owner' ? 'bg-blue-50 ml-auto' : 'bg-gray-50'
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
