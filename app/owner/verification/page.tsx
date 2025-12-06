// app/owner/verification/page.tsx
// Verification status and document management

"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';

interface VerificationRequest {
  id: string;
  status: string;
  notes?: string;
  submitted_at: string;
  reviewed_at?: string;
}

interface VerificationDocument {
  id: string;
  doc_type: string;
  file_url: string;
  file_name?: string;
}

interface Shop {
  id: string;
  name: string;
  verification_status?: string;
  verification_notes?: string;
}

export default function VerificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      // Load shop
      const shopRes = await fetch(`${apiUrl}/shops/owner`, {
        headers: { 'x-user-id': user.id },
      });
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData.shops && shopData.shops.length > 0) {
          const shopItem = shopData.shops[0];
          setShop(shopItem);

          // Load verification request
          const verRes = await fetch(`${apiUrl}/shops/${shopItem.id}/verification`, {
            headers: { 'x-user-id': user.id },
          });
          if (verRes.ok) {
            const verData = await verRes.json();
            setVerificationRequest(verData.request);
            setDocuments(verData.documents || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, docType: string) => {
    if (!user?.id || !shop?.id) return;

    setUploading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${shop.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      // Create document record
      const docRes = await fetch(`${apiUrl}/shops/${shop.id}/verification/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          doc_type: docType,
          file_url: publicUrl,
          file_name: file.name,
        }),
      });

      if (!docRes.ok) {
        throw new Error('Failed to save document record');
      }

      await loadData(); // Reload to show new document
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async () => {
    if (!user?.id || !shop?.id) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/shops/${shop.id}/verification/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to resubmit verification');
      }

      await loadData();
    } catch (error: any) {
      console.error('Error resubmitting:', error);
      setError(error.message || 'Failed to resubmit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No shop found. Please create a shop first.</p>
        <Link href="/owner/create-shop" className="text-blue-600 hover:underline mt-4 inline-block">
          Create Shop →
        </Link>
      </div>
    );
  }

  const verificationStatus = shop.verification_status || 'not_submitted';
  const canResubmit = verificationStatus === 'rejected';
  const isReadOnly = verificationStatus === 'approved'; // Once approved, owners cannot edit

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Verification & Documents</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Status Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Verification Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
              verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {verificationStatus === 'approved' ? '✅ Approved' :
               verificationStatus === 'pending' ? '⏳ Pending' :
               verificationStatus === 'rejected' ? '❌ Rejected' :
               '📝 Not Submitted'}
            </span>
          </div>
          {shop.verification_notes && (
            <div>
              <span className="font-medium">Notes:</span>
              <p className="mt-1 text-gray-600">{shop.verification_notes}</p>
            </div>
          )}
          {verificationRequest && (
            <>
              <div>
                <span className="font-medium">Submitted:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(verificationRequest.submitted_at).toLocaleDateString()}
                </span>
              </div>
              {verificationRequest.reviewed_at && (
                <div>
                  <span className="font-medium">Reviewed:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(verificationRequest.reviewed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
        
        {documents.length === 0 ? (
          <p className="text-gray-600 mb-4">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{doc.doc_type.replace('_', ' ')}</span>
                  {doc.file_name && (
                    <span className="ml-2 text-sm text-gray-600">({doc.file_name})</span>
                  )}
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Upload New Documents */}
        {canResubmit && !isReadOnly && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Upload Additional Documents</h3>
            {(['owner_id', 'business_registration', 'tax_doc', 'lease', 'other'] as const).map((docType) => (
              <div key={docType} className="mb-3">
                <label className="block text-sm font-medium mb-2">
                  {docType === 'owner_id' && 'Owner ID Document'}
                  {docType === 'business_registration' && 'Business Registration / License'}
                  {docType === 'tax_doc' && 'Tax Document'}
                  {docType === 'lease' && 'Lease Agreement'}
                  {docType === 'other' && 'Other Document'}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && !isReadOnly) {
                      handleFileUpload(file, docType);
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                  disabled={uploading || isReadOnly}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {canResubmit && !isReadOnly && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Resubmit Verification</h2>
          <p className="text-gray-600 mb-4">
            Your verification was rejected. Please review the feedback, upload any additional documents, and resubmit.
          </p>
          <button
            onClick={handleResubmit}
            disabled={uploading || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Resubmit for Review'}
          </button>
        </div>
      )}

      {verificationStatus === 'not_submitted' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <p className="text-sm text-blue-700">
            <strong>Get Started:</strong> Upload your verification documents and submit your shop for review.
          </p>
          <Link href="/owner/create-shop" className="mt-2 inline-block text-sm font-medium text-blue-800 hover:text-blue-900">
            Complete Shop Setup →
          </Link>
        </div>
      )}
    </div>
  );
}

