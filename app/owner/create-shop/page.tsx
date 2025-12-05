// app/owner/create-shop/page.tsx
// Multi-step shop creation/claim wizard

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Step = 'owner-identity' | 'business-info' | 'shop-info' | 'verification-docs' | 'review';

interface OwnerIdentityData {
  full_name: string;
  personal_phone: string;
  personal_email: string;
  role: 'owner' | 'manager' | 'representative';
}

interface BusinessInfoData {
  registered_business_name: string;
  business_registration_number: string;
  business_type: 'individual' | 'corporation' | 'franchise' | '';
  tax_status: 'registered' | 'not_registered' | 'unknown' | '';
}

interface ShopInfoData {
  shop_display_name: string;
  prefecture: string;
  city: string;
  street: string;
  postal_code: string;
  shop_phone: string;
  shop_email: string;
  main_category: string;
  subcategories: string[];
  languages_supported: string[];
  target_customers: string[];
  shop_front_image?: string;
  interior_image?: string;
}

interface VerificationDoc {
  id: string;
  doc_type: 'owner_id' | 'business_registration' | 'tax_doc' | 'lease' | 'other';
  file_url: string;
  file_name: string;
}

export default function CreateShopPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState<Step>('owner-identity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [ownerIdentity, setOwnerIdentity] = useState<OwnerIdentityData>({
    full_name: '',
    personal_phone: '',
    personal_email: user?.email || '',
    role: 'owner',
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfoData>({
    registered_business_name: '',
    business_registration_number: '',
    business_type: '',
    tax_status: '',
  });

  const [shopInfo, setShopInfo] = useState<ShopInfoData>({
    shop_display_name: '',
    prefecture: '',
    city: '',
    street: '',
    postal_code: '',
    shop_phone: '',
    shop_email: '',
    main_category: '',
    subcategories: [],
    languages_supported: [],
    target_customers: [],
  });

  const [verificationDocs, setVerificationDocs] = useState<VerificationDoc[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [user, authLoading, router]);

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

  const handleNext = () => {
    if (currentStep === 'owner-identity') {
      if (!ownerIdentity.full_name || !ownerIdentity.personal_phone || !ownerIdentity.personal_email) {
        setError('Please fill in all required fields');
        return;
      }
      setCurrentStep('business-info');
    } else if (currentStep === 'business-info') {
      setCurrentStep('shop-info');
    } else if (currentStep === 'shop-info') {
      if (!shopInfo.shop_display_name || !shopInfo.prefecture || !shopInfo.city) {
        setError('Please fill in all required shop information');
        return;
      }
      setCurrentStep('verification-docs');
    } else if (currentStep === 'verification-docs') {
      if (verificationDocs.length === 0) {
        setError('Please upload at least one verification document');
        return;
      }
      setCurrentStep('review');
    }
    setError(null);
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('verification-docs');
    } else if (currentStep === 'verification-docs') {
      setCurrentStep('shop-info');
    } else if (currentStep === 'shop-info') {
      setCurrentStep('business-info');
    } else if (currentStep === 'business-info') {
      setCurrentStep('owner-identity');
    }
    setError(null);
  };

  const handleFileUpload = async (file: File, docType: VerificationDoc['doc_type']) => {
    if (!user?.id) return;

    setUploadingDocs(true);
    try {
      const supabase = getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
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

      const newDoc: VerificationDoc = {
        id: Math.random().toString(36).substring(7),
        doc_type: docType,
        file_url: publicUrl,
        file_name: file.name,
      };

      setVerificationDocs([...verificationDocs, newDoc]);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreedToTerms || !authorized) {
      setError('Please confirm all required checkboxes');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to create a shop');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create owner profile
      const ownerProfileRes = await fetch(`${apiUrl}/owner/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          full_name: ownerIdentity.full_name,
          personal_phone: ownerIdentity.personal_phone,
          personal_email: ownerIdentity.personal_email,
          role: ownerIdentity.role,
        }),
      });

      if (!ownerProfileRes.ok) {
        throw new Error('Failed to create owner profile');
      }

      const ownerProfile = await ownerProfileRes.json();

      // Step 2: Create shop
      const shopRes = await fetch(`${apiUrl}/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: shopInfo.shop_display_name,
          address: `${shopInfo.postal_code} ${shopInfo.prefecture} ${shopInfo.city} ${shopInfo.street}`,
          prefecture: shopInfo.prefecture,
          phone: shopInfo.shop_phone,
          email: shopInfo.shop_email,
          category_id: shopInfo.main_category,
          subcategory: shopInfo.subcategories[0] || '',
          owner_user_id: user.id,
          registered_business_name: businessInfo.registered_business_name || null,
          business_registration_number: businessInfo.business_registration_number || null,
          business_type: businessInfo.business_type || null,
          tax_status: businessInfo.tax_status || null,
          languages_supported: shopInfo.languages_supported,
          target_customers: shopInfo.target_customers,
          verification_status: 'pending',
          is_verified: false,
          booking_enabled: false,
          ai_enabled: false,
          subscription_plan: 'free',
        }),
      });

      if (!shopRes.ok) {
        const errorData = await shopRes.json();
        throw new Error(errorData.error || 'Failed to create shop');
      }

      const shop = await shopRes.json();

      // Step 3: Create verification request and upload documents
      const verificationRes = await fetch(`${apiUrl}/shops/${shop.id}/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          owner_profile_id: ownerProfile.id,
          documents: verificationDocs,
        }),
      });

      if (!verificationRes.ok) {
        throw new Error('Failed to submit verification request');
      }

      // Success - redirect to dashboard
      router.push('/owner/dashboard');
    } catch (error: any) {
      console.error('Error creating shop:', error);
      setError(error.message || 'Failed to create shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'owner-identity', label: 'Owner Identity' },
    { key: 'business-info', label: 'Business Info' },
    { key: 'shop-info', label: 'Shop Info' },
    { key: 'verification-docs', label: 'Verification Documents' },
    { key: 'review', label: 'Review & Submit' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Your Shop</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    idx <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="mt-2 text-xs text-center">{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    idx < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {currentStep === 'owner-identity' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Owner Identity</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                value={ownerIdentity.full_name}
                onChange={(e) => setOwnerIdentity({ ...ownerIdentity, full_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Personal Phone *</label>
              <input
                type="tel"
                value={ownerIdentity.personal_phone}
                onChange={(e) => setOwnerIdentity({ ...ownerIdentity, personal_phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Personal Email *</label>
              <input
                type="email"
                value={ownerIdentity.personal_email}
                onChange={(e) => setOwnerIdentity({ ...ownerIdentity, personal_email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role *</label>
              <select
                value={ownerIdentity.role}
                onChange={(e) => setOwnerIdentity({ ...ownerIdentity, role: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="representative">Representative</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 'business-info' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Business Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Registered Business Name</label>
              <input
                type="text"
                value={businessInfo.registered_business_name}
                onChange={(e) => setBusinessInfo({ ...businessInfo, registered_business_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Business Registration Number</label>
              <input
                type="text"
                value={businessInfo.business_registration_number}
                onChange={(e) => setBusinessInfo({ ...businessInfo, business_registration_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Business Type</label>
              <select
                value={businessInfo.business_type}
                onChange={(e) => setBusinessInfo({ ...businessInfo, business_type: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="individual">Individual</option>
                <option value="corporation">Corporation</option>
                <option value="franchise">Franchise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tax Status</label>
              <select
                value={businessInfo.tax_status}
                onChange={(e) => setBusinessInfo({ ...businessInfo, tax_status: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                <option value="registered">Registered</option>
                <option value="not_registered">Not Registered</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 'shop-info' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Shop Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Shop Display Name *</label>
              <input
                type="text"
                value={shopInfo.shop_display_name}
                onChange={(e) => setShopInfo({ ...shopInfo, shop_display_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prefecture *</label>
                <input
                  type="text"
                  value={shopInfo.prefecture}
                  onChange={(e) => setShopInfo({ ...shopInfo, prefecture: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  value={shopInfo.city}
                  onChange={(e) => setShopInfo({ ...shopInfo, city: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Street Address</label>
              <input
                type="text"
                value={shopInfo.street}
                onChange={(e) => setShopInfo({ ...shopInfo, street: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Postal Code</label>
              <input
                type="text"
                value={shopInfo.postal_code}
                onChange={(e) => setShopInfo({ ...shopInfo, postal_code: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Shop Phone</label>
                <input
                  type="tel"
                  value={shopInfo.shop_phone}
                  onChange={(e) => setShopInfo({ ...shopInfo, shop_phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Shop Email</label>
                <input
                  type="email"
                  value={shopInfo.shop_email}
                  onChange={(e) => setShopInfo({ ...shopInfo, shop_email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Main Category</label>
              <select
                value={shopInfo.main_category}
                onChange={(e) => setShopInfo({ ...shopInfo, main_category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Customers</label>
              <div className="flex flex-wrap gap-2">
                {['men', 'women', 'couples', 'families'].map((target) => (
                  <label key={target} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shopInfo.target_customers.includes(target)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShopInfo({
                            ...shopInfo,
                            target_customers: [...shopInfo.target_customers, target],
                          });
                        } else {
                          setShopInfo({
                            ...shopInfo,
                            target_customers: shopInfo.target_customers.filter((t) => t !== target),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    {target.charAt(0).toUpperCase() + target.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'verification-docs' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Verification Documents</h2>
            <p className="text-gray-600 mb-4">
              Please upload the required documents for verification. At least one document is required.
            </p>
            
            {(['owner_id', 'business_registration', 'tax_doc', 'lease', 'other'] as const).map((docType) => (
              <div key={docType} className="border rounded-lg p-4">
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
                    if (file) {
                      handleFileUpload(file, docType);
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                  disabled={uploadingDocs}
                />
                {verificationDocs.filter((d) => d.doc_type === docType).map((doc) => (
                  <div key={doc.id} className="mt-2 text-sm text-green-600">
                    ✓ {doc.file_name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Review & Submit</h2>
            
            <div>
              <h3 className="font-semibold mb-2">Owner Identity</h3>
              <p>Name: {ownerIdentity.full_name}</p>
              <p>Phone: {ownerIdentity.personal_phone}</p>
              <p>Email: {ownerIdentity.personal_email}</p>
              <p>Role: {ownerIdentity.role}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Business Info</h3>
              <p>Business Name: {businessInfo.registered_business_name || 'N/A'}</p>
              <p>Registration Number: {businessInfo.business_registration_number || 'N/A'}</p>
              <p>Type: {businessInfo.business_type || 'N/A'}</p>
              <p>Tax Status: {businessInfo.tax_status || 'N/A'}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Shop Info</h3>
              <p>Name: {shopInfo.shop_display_name}</p>
              <p>Address: {shopInfo.prefecture} {shopInfo.city} {shopInfo.street}</p>
              <p>Phone: {shopInfo.shop_phone || 'N/A'}</p>
              <p>Email: {shopInfo.shop_email || 'N/A'}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Uploaded Documents</h3>
              <ul className="list-disc list-inside">
                {verificationDocs.map((doc) => (
                  <li key={doc.id}>{doc.file_name} ({doc.doc_type})</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={(e) => setAuthorized(e.target.checked)}
                  className="mr-2"
                />
                <span>I am authorized to manage this business.</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mr-2"
                />
                <span>I agree to the platform terms.</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="mr-2"
                />
                <span>I understand my shop will not be live until approved.</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 'owner-identity'}
          className="px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {currentStep !== 'review' ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !agreedToTerms || !authorized}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}

