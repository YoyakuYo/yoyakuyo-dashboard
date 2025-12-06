// app/owner/claim/page.tsx
// Shop claim flow - STRICT 3-STEP PROCESS
// STEP 1: Owner Identity
// STEP 2: Legal Documents
// STEP 3: Staff Review Only

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { useAuth } from '@/lib/useAuth';
import { REGIONS } from '@/lib/regions';
import { PREFECTURES } from '@/lib/prefectures';

interface Shop {
  id: string;
  name: string;
  address?: string;
  category_id?: string;
  prefecture?: string;
  normalized_city?: string;
  subcategory?: string;
}

interface Category {
  id: string;
  name: string;
}

interface IdentityFormData {
  full_name: string;
  date_of_birth: string;
  nationality: string;
  country_of_residence: string;
  home_address: string;
  address_line1: string;
  address_line2: string;
  city: string;
  prefecture: string;
  postal_code: string;
  phone_number: string;
  email: string;
  role_in_business: 'Owner' | 'Manager' | 'Authorized Agent';
  position_title: string;
  since_when: string;
}

interface DocumentUpload {
  document_type: string;
  file: File;
  file_url?: string;
}

type ClaimStep = 'select' | 'identity' | 'documents' | 'submitted';

export default function ClaimShopPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<ClaimStep>('select');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [unclaimedShops, setUnclaimedShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verification, setVerification] = useState<{ id: string; verification_status: string; shop_id?: string } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('all');
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Identity form data
  const [identityData, setIdentityData] = useState<IdentityFormData>({
    full_name: '',
    date_of_birth: '',
    nationality: '',
    country_of_residence: '',
    home_address: '',
    address_line1: '',
    address_line2: '',
    city: '',
    prefecture: '',
    postal_code: '',
    phone_number: '',
    email: user?.email || '',
    role_in_business: 'Owner',
    position_title: '',
    since_when: '',
  });

  // Document uploads
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiUrl}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    if (apiUrl) {
      fetchCategories();
    }
  }, [apiUrl]);

  // Check for existing verification on mount
  useEffect(() => {
    if (!authLoading && user) {
      checkExistingClaim();
    }
  }, [authLoading, user]);

  // Fetch unclaimed shops
  useEffect(() => {
    if (!authLoading && user) {
      fetchUnclaimedShops();
    }
  }, [authLoading, user, selectedCategory, selectedRegion, selectedPrefecture, debouncedSearch]);

  const checkExistingClaim = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiUrl}/api/owner/claims/my`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        const existingClaim = data.claims?.find((c: any) => 
          ['draft', 'submitted', 'pending', 'resubmission_required'].includes(c.status)
        );
        
        if (existingClaim) {
          setVerificationId(existingClaim.id);
          setVerification({
            id: existingClaim.id,
            verification_status: existingClaim.status,
            shop_id: existingClaim.shop_id,
          });
          
          // Load shop info
          if (existingClaim.shop_id) {
            const shopRes = await fetch(`${apiUrl}/shops/${existingClaim.shop_id}`, {
              headers: { 'x-user-id': user.id },
            });
            if (shopRes.ok) {
              const shopData = await shopRes.json();
              setSelectedShop(shopData);
            }
          }
          
          // If resubmission_required or draft, go to documents step
          if (existingClaim.status === 'resubmission_required' || existingClaim.status === 'draft') {
            setStep('documents');
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing claim:', error);
    }
  };

  const fetchUnclaimedShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('unclaimed', 'true');
      params.set('page', '1');
      params.set('limit', '200');
      
      if (selectedRegion !== 'all') {
        params.set('region', selectedRegion);
      }
      if (selectedPrefecture !== 'all') {
        params.set('prefecture', selectedPrefecture);
      }
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      const res = await fetch(`${apiUrl}/shops?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const shopsArray = Array.isArray(data)
          ? data
          : (data.shops && Array.isArray(data.shops) ? data.shops : []);
        setUnclaimedShops(shopsArray);
      } else {
        setUnclaimedShops([]);
      }
    } catch (error) {
      console.error('Error fetching unclaimed shops:', error);
      setUnclaimedShops([]);
    } finally {
      setLoading(false);
    }
  };

  const availablePrefectures = useMemo(() => {
    if (selectedRegion === 'all') {
      return PREFECTURES;
    }
    const region = REGIONS.find(r => r.key === selectedRegion);
    if (!region) return [];
    return PREFECTURES.filter(p => region.prefectures.includes(p.key));
  }, [selectedRegion]);

  const handleSelectShop = async (shop: Shop) => {
    if (!user?.id) {
      setError('You must be logged in to claim a shop');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // Start claim process - creates claim with status='draft'
      const res = await fetch(`${apiUrl}/api/owner/claims/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ shop_id: shop.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationId(data.claim_id);
        setSelectedShop(shop);
        setStep('identity');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to start claim process');
        // If there's an existing claim, redirect to documents
        if (errorData.claim_id) {
          setVerificationId(errorData.claim_id);
          setSelectedShop(shop);
          if (errorData.status === 'draft' || errorData.status === 'resubmission_required') {
            setStep('documents');
          }
        }
      }
    } catch (error: any) {
      console.error('Error starting claim:', error);
      setError(error.message || 'Failed to start claim process');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all required fields for new API
    if (!identityData.full_name.trim() || !identityData.date_of_birth || 
        !identityData.country_of_residence.trim() ||
        !identityData.address_line1.trim() || !identityData.city.trim() || 
        !identityData.prefecture.trim() || !identityData.phone_number.trim() ||
        !identityData.email.trim()) {
      setError('Please fill in all required fields: Full Name, Date of Birth, Country, Address Line 1, City, Prefecture, Phone, and Email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identityData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!selectedShop || !user) {
      setError(t('common.error') + ': Shop or user not selected');
      return;
    }

    if (!verificationId) {
      setError('Claim ID not found. Please select a shop first.');
      return;
    }

    try {
      setSubmitting(true);

      // Map form fields to new API structure
      const step1Data = {
        full_name: identityData.full_name,
        date_of_birth: identityData.date_of_birth,
        country: identityData.country_of_residence || identityData.nationality,
        address_line1: identityData.address_line1 || identityData.home_address,
        address_line2: identityData.address_line2 || '',
        city: identityData.city,
        prefecture: identityData.prefecture || selectedShop?.prefecture || '',
        postal_code: identityData.postal_code || '',
        company_phone: identityData.phone_number,
        company_email: identityData.email,
      };

      const res = await fetch(`${apiUrl}/api/owner/claims/${verificationId}/step1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(step1Data),
      });

      if (res.ok) {
        const data = await res.json();
        setStep('documents');
      } else {
        const errorData = await res.json();
        setError(errorData.error || t('common.error') + ': Failed to submit identity information');
      }
    } catch (error: any) {
      console.error('Error submitting identity:', error);
      setError(error.message || t('common.error') + ': Failed to submit identity information');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Each file must be less than 10MB');
      return;
    }

    // Check if document type already exists
    const existingIndex = documents.findIndex(d => d.document_type === documentType);
    if (existingIndex >= 0) {
      // Replace existing
      const updated = [...documents];
      updated[existingIndex] = { document_type: documentType, file };
      setDocuments(updated);
    } else {
      // Add new
      if (documents.length >= 3) {
        setError(t('claim.errorMaxFiles'));
        return;
      }
      setDocuments([...documents, { document_type: documentType, file }]);
    }

    setError(null);
  };

  const removeDocument = (documentType: string) => {
    setDocuments(documents.filter(d => d.document_type !== documentType));
  };

  const uploadFileToStorage = async (file: File, verificationId: string): Promise<string> => {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const bucket = 'verification-documents';
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    // Use user_id as first folder (for RLS policy), then verification_id
    const filePath = `${user?.id}/${verificationId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleDocumentsSubmit = async () => {
    if (!verificationId || !user) {
      setError(t('common.error') + ': Verification ID or user not found');
      return;
    }

    // ENFORCE: At least one document must be uploaded
    if (documents.length === 0) {
      setError('You must upload at least one document (ID, license, etc.) before submitting.');
      return;
    }

    // Validate mandatory documents
    const mandatoryTypes = ['business_registration', 'tax_registration', 'commercial_registry'];
    const hasMandatory = documents.some(d => mandatoryTypes.includes(d.document_type));
    
    if (!hasMandatory) {
      setError('At least one mandatory document is required: Business Registration, Tax Registration, or Commercial Registry');
      return;
    }

    // Validate address proof
    const addressProofTypes = ['lease_contract', 'utility_bill', 'bank_statement'];
    const hasAddressProof = documents.some(d => addressProofTypes.includes(d.document_type));
    
    if (!hasAddressProof) {
      setError('At least one address proof is required: Lease Contract, Utility Bill, or Bank Statement');
      return;
    }

    try {
      setFileUploading(true);
      setError(null);

      // Upload files one at a time using new API
      for (const doc of documents) {
        const fileUrl = await uploadFileToStorage(doc.file, verificationId);
        
        // Map old document_type to new doc_type enum
        let docType: 'business_proof' | 'id_document' | 'other' = 'other';
        if (['business_registration', 'tax_registration', 'commercial_registry', 'lease_contract', 'utility_bill', 'bank_statement'].includes(doc.document_type)) {
          docType = 'business_proof';
        } else if (['government_id', 'selfie_with_id'].includes(doc.document_type)) {
          docType = 'id_document';
        }

        const res = await fetch(`${apiUrl}/api/owner/claims/${verificationId}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({
            doc_type: docType,
            file_url: fileUrl,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to upload document');
        }
      }

      // After all documents uploaded, submit the claim
      const submitRes = await fetch(`${apiUrl}/api/owner/claims/${verificationId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
      });

      if (submitRes.ok) {
        setStep('submitted');
      } else {
        const errorData = await submitRes.json();
        setError(errorData.error || t('common.error') + ': Failed to submit claim');
      }
    } catch (error: any) {
      console.error('Error submitting documents:', error);
      setError(error.message || t('common.error') + ': Failed to submit documents');
    } finally {
      setFileUploading(false);
    }
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
          {/* STEP 1: SELECT SHOP */}
          {step === 'select' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('claim.title')}</h1>
              <p className="text-gray-600 mb-6">
                {t('claim.subtitle')}
              </p>

              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('claim.searchShops')}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('claim.searchPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.category')}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">{t('claim.allCategories')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.region')}
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedPrefecture('all');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">{t('claim.allRegions')}</option>
                      {REGIONS.map((region) => (
                        <option key={region.key} value={region.key}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.prefecture')}
                    </label>
                    <select
                      value={selectedPrefecture}
                      onChange={(e) => setSelectedPrefecture(e.target.value)}
                      disabled={selectedRegion === 'all'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="all">{t('claim.allPrefectures')}</option>
                      {availablePrefectures.map((pref) => (
                        <option key={pref.key} value={pref.key}>
                          {pref.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {t('claim.showingShops', { count: unclaimedShops.length })}
                  {(debouncedSearch || selectedCategory !== 'all' || selectedPrefecture !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedRegion('all');
                        setSelectedPrefecture('all');
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      {t('claim.clearFilters')}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">Error: {error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">{t('claim.loadingShops')}</p>
                </div>
              ) : unclaimedShops.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">{t('claim.noUnclaimedShops')}</p>
                  <p className="text-sm mt-2">{t('claim.allShopsClaimed')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unclaimedShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSelectShop(shop)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                          {shop.address && (
                            <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!submitting) {
                              handleSelectShop(shop);
                            }
                          }}
                          disabled={submitting}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? t('claim.loading') || 'Loading...' : t('claim.claimThisShop')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: OWNER IDENTITY */}
          {step === 'identity' && selectedShop && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('claim.ownerIdentity')}</h1>
                  <p className="text-gray-600">
                    {t('claim.shopLabel')}: <span className="font-semibold">{selectedShop.name}</span>
                  </p>
                  {selectedShop.address && (
                    <p className="text-sm text-gray-500 mt-1">{selectedShop.address}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedShop(null);
                    setIdentityData({
                      full_name: '',
                      date_of_birth: '',
                      nationality: '',
                      country_of_residence: '',
                      home_address: '',
                      address_line1: '',
                      address_line2: '',
                      city: '',
                      prefecture: '',
                      postal_code: '',
                      phone_number: '',
                      email: user?.email || '',
                      role_in_business: 'Owner',
                      position_title: '',
                      since_when: '',
                    });
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
              </div>

              <form onSubmit={handleIdentitySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.fullLegalName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={identityData.full_name}
                      onChange={(e) => setIdentityData({ ...identityData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.dateOfBirth')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={identityData.date_of_birth}
                      onChange={(e) => setIdentityData({ ...identityData, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.nationality')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={identityData.nationality}
                      onChange={(e) => setIdentityData({ ...identityData, nationality: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.countryOfResidence')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={identityData.country_of_residence}
                      onChange={(e) => setIdentityData({ ...identityData, country_of_residence: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.phoneNumber')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={identityData.phone_number}
                      onChange={(e) => setIdentityData({ ...identityData, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.personalEmail')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={identityData.email}
                      onChange={(e) => setIdentityData({ ...identityData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.roleInBusiness')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={identityData.role_in_business}
                      onChange={(e) => setIdentityData({ ...identityData, role_in_business: e.target.value as 'Owner' | 'Manager' | 'Authorized Agent' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Owner">{t('claim.roleOwner')}</option>
                      <option value="Manager">{t('claim.roleManager')}</option>
                      <option value="Authorized Agent">{t('claim.roleAuthorizedAgent')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.positionTitle')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={identityData.position_title}
                      onChange={(e) => setIdentityData({ ...identityData, position_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('claim.sinceWhen')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={identityData.since_when}
                      onChange={(e) => setIdentityData({ ...identityData, since_when: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('claim.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('claim.submitting') : t('claim.continueToDocuments')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: DOCUMENT UPLOAD */}
          {step === 'documents' && selectedShop && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Legal Documents</h1>
                  <p className="text-gray-600">
                    Shop: <span className="font-semibold">{selectedShop.name}</span>
                  </p>
                  {verification && verification.verification_status === 'resubmission_required' && (
                    <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800 font-medium">
                        📋 Resubmission Required: Upload at least one document before resubmitting.
                      </p>
                    </div>
                  )}
                </div>
                {verification?.verification_status !== 'resubmission_required' && (
                  <button
                    onClick={() => setStep('identity')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">📄 {t('claim.documentRequirements')}:</p>
                <p className="text-sm text-blue-700 mb-2 font-semibold">{t('claim.mandatoryTitle')}</p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mb-3">
                  <li>{t('claim.mandatoryList1')}</li>
                  <li>{t('claim.mandatoryList2')}</li>
                  <li>{t('claim.mandatoryList3')}</li>
                </ul>
                <p className="text-sm text-blue-700 mb-2 font-semibold">{t('claim.plusOneTitle')}</p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mb-3">
                  <li>{t('claim.plusOneList1')}</li>
                  <li>{t('claim.plusOneList2')}</li>
                  <li>{t('claim.plusOneList3')}</li>
                </ul>
                <p className="text-sm text-blue-700 mb-2 font-semibold">{t('claim.optionalTitle')}</p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mb-2">
                  <li>{t('claim.optionalList1')}</li>
                  <li>{t('claim.optionalList2')}</li>
                </ul>
                <p className="text-sm text-blue-700 font-medium">
                  {t('claim.acceptedFormats')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Mandatory Documents */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('claim.mandatoryDocuments')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['business_registration', 'tax_registration', 'commercial_registry'].map((docType) => {
                      const doc = documents.find(d => d.document_type === docType);
                      return (
                        <div key={docType} className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {docType === 'business_registration' ? t('claim.mandatoryList1') :
                             docType === 'tax_registration' ? t('claim.mandatoryList2') :
                             docType === 'commercial_registry' ? t('claim.mandatoryList3') :
                             docType === 'lease_contract' ? t('claim.plusOneList1') :
                             docType === 'utility_bill' ? t('claim.plusOneList2') :
                             docType === 'bank_statement' ? t('claim.plusOneList3') :
                             docType === 'government_id' ? t('claim.optionalList1') :
                             docType === 'selfie_with_id' ? t('claim.optionalList2') :
                             docType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </label>
                          {doc ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{doc.file.name}</span>
                              <button
                                onClick={() => removeDocument(docType)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                {t('claim.remove')}
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleFileSelect(e, docType)}
                              className="w-full text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Address Proof Documents */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('claim.addressProof')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['lease_contract', 'utility_bill', 'bank_statement'].map((docType) => {
                      const doc = documents.find(d => d.document_type === docType);
                      return (
                        <div key={docType} className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {docType === 'business_registration' ? t('claim.mandatoryList1') :
                             docType === 'tax_registration' ? t('claim.mandatoryList2') :
                             docType === 'commercial_registry' ? t('claim.mandatoryList3') :
                             docType === 'lease_contract' ? t('claim.plusOneList1') :
                             docType === 'utility_bill' ? t('claim.plusOneList2') :
                             docType === 'bank_statement' ? t('claim.plusOneList3') :
                             docType === 'government_id' ? t('claim.optionalList1') :
                             docType === 'selfie_with_id' ? t('claim.optionalList2') :
                             docType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </label>
                          {doc ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{doc.file.name}</span>
                              <button
                                onClick={() => removeDocument(docType)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                {t('claim.remove')}
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleFileSelect(e, docType)}
                              className="w-full text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Documents */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('claim.optionalDocuments')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['government_id', 'selfie_with_id'].map((docType) => {
                      const doc = documents.find(d => d.document_type === docType);
                      return (
                        <div key={docType} className="border border-gray-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {docType === 'business_registration' ? t('claim.mandatoryList1') :
                             docType === 'tax_registration' ? t('claim.mandatoryList2') :
                             docType === 'commercial_registry' ? t('claim.mandatoryList3') :
                             docType === 'lease_contract' ? t('claim.plusOneList1') :
                             docType === 'utility_bill' ? t('claim.plusOneList2') :
                             docType === 'bank_statement' ? t('claim.plusOneList3') :
                             docType === 'government_id' ? t('claim.optionalList1') :
                             docType === 'selfie_with_id' ? t('claim.optionalList2') :
                             docType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </label>
                          {doc ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{doc.file.name}</span>
                              <button
                                onClick={() => removeDocument(docType)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                {t('claim.remove')}
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleFileSelect(e, docType)}
                              className="w-full text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('identity')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('claim.back')}
                  </button>
                  <button
                    onClick={handleDocumentsSubmit}
                    disabled={documents.length === 0 || fileUploading || submitting}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fileUploading || submitting ? t('claim.submitting') : t('claim.submitForReview')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUBMITTED */}
          {step === 'submitted' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('claim.claimSubmitted')}</h1>
              <div className="max-w-2xl mx-auto space-y-4 text-gray-600">
                <p className="text-lg">
                  {t('claim.submittedMessage1')}
                </p>
                <p>
                  {t('claim.submittedMessage2')}
                </p>
                <p className="font-semibold text-gray-900">
                  {t('claim.noAutoApproval')}
                </p>
              </div>
              <div className="mt-8">
                <button
                  onClick={() => router.push('/owner/dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('claim.backToDashboard')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
