// app/admin/shop-claims/page.tsx
// Admin interface for reviewing and approving/rejecting shop claim requests

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { useAuth } from '@/lib/useAuth';

interface ClaimFile {
  id: string;
  claim_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
}

interface ClaimRequest {
  id: string;
  shop_id: string;
  owner_user_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone?: string;
  claimant_website?: string;
  shop_name_at_time: string;
  shop_address_at_time: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
  decided_at?: string;
  shops?: {
    id: string;
    name: string;
    address?: string;
  };
  profiles?: {
    id: string;
    email: string;
  };
  files?: ClaimFile[];
}

export default function AdminShopClaimsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPendingClaims();
    }
  }, [authLoading, user]);

  const fetchPendingClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/shop-claims/pending`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setClaims(data || []);
      } else {
        console.error('Failed to fetch pending claims');
        setClaims([]);
      }
    } catch (error) {
      console.error('Error fetching pending claims:', error);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId: string) => {
    if (!confirm('Are you sure you want to approve this claim? The shop will be assigned to the owner.')) {
      return;
    }

    try {
      setProcessingId(claimId);
      setError(null);

      const res = await fetch(`${apiUrl}/shop-claims/${claimId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          admin_note: adminNote[claimId] || null,
        }),
      });

      if (res.ok) {
        // Refresh the list
        await fetchPendingClaims();
        alert('Claim approved successfully. Shop has been assigned to the owner.');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to approve claim');
      }
    } catch (error: any) {
      console.error('Error approving claim:', error);
      setError(error.message || 'Failed to approve claim');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    if (!confirm('Are you sure you want to reject this claim?')) {
      return;
    }

    try {
      setProcessingId(claimId);
      setError(null);

      const res = await fetch(`${apiUrl}/shop-claims/${claimId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          admin_note: adminNote[claimId] || null,
        }),
      });

      if (res.ok) {
        // Refresh the list
        await fetchPendingClaims();
        alert('Claim rejected.');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to reject claim');
      }
    } catch (error: any) {
      console.error('Error rejecting claim:', error);
      setError(error.message || 'Failed to reject claim');
    } finally {
      setProcessingId(null);
    }
  };

  const getFileUrl = (filePath: string): string => {
    // Construct Supabase storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return '#';
    
    // Supabase storage public URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
    return `${supabaseUrl}/storage/v1/object/public/shop-claims/${filePath}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Claim Requests</h1>
              <p className="text-gray-600">Review and approve/reject shop ownership claims</p>
            </div>
            <button
              onClick={fetchPendingClaims}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Important Verification Rule:</p>
            <p className="text-sm text-yellow-700">
              Approve only if the uploaded documents clearly show the same shop name and address as this shop in YoyakuYo. If the name/address does not match, reject the claim.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No pending claim requests</p>
              <p className="text-sm mt-2">All claims have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Shop Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Shop Name:</span>
                          <p className="text-gray-900">{claim.shops?.name || claim.shop_name_at_time}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Shop Address:</span>
                          <p className="text-gray-900">{claim.shops?.address || claim.shop_address_at_time}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Shop ID:</span>
                          <p className="text-gray-600 font-mono text-xs">{claim.shop_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Claimant Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Claimant Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Name:</span>
                          <p className="text-gray-900">{claim.claimant_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <p className="text-gray-900">{claim.claimant_email}</p>
                        </div>
                        {claim.claimant_phone && (
                          <div>
                            <span className="font-medium text-gray-700">Phone:</span>
                            <p className="text-gray-900">{claim.claimant_phone}</p>
                          </div>
                        )}
                        {claim.claimant_website && (
                          <div>
                            <span className="font-medium text-gray-700">Website:</span>
                            <p className="text-gray-900">
                              <a
                                href={claim.claimant_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {claim.claimant_website}
                              </a>
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <p className="text-gray-600">
                            {new Date(claim.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matching Info */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Matching Information (for verification):</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-gray-700">Shop Name at Time of Claim:</span>
                          <p className="text-gray-900 mt-1">{claim.shop_name_at_time}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Shop Address at Time of Claim:</span>
                          <p className="text-gray-900 mt-1">{claim.shop_address_at_time}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents */}
                  {claim.files && claim.files.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Documents:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {claim.files.map((file) => (
                          <div
                            key={file.id}
                            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-2xl">
                                {file.file_type?.startsWith('image/') ? '🖼️' : '📄'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.file_name}
                                </p>
                                {file.file_size && (
                                  <p className="text-xs text-gray-500">
                                    {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={getFileUrl(file.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              View Document →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Note */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Note (optional):
                    </label>
                    <textarea
                      value={adminNote[claim.id] || ''}
                      onChange={(e) => setAdminNote({ ...adminNote, [claim.id]: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Add a note about your decision..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      onClick={() => handleReject(claim.id)}
                      disabled={processingId === claim.id}
                      className="px-6 py-2 border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === claim.id ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(claim.id)}
                      disabled={processingId === claim.id}
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === claim.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

