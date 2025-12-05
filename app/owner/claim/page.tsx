// app/owner/claim/page.tsx
// Shop claim flow with document upload

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/apiClient';
import { useAuth } from '@/lib/useAuth';
import { PREFECTURES, REGIONS } from '@/lib/browse/shopBrowseData';
import { extractPrefecture } from '@/lib/browse/shopBrowseData';

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

interface ClaimFormData {
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string;
  claimant_website: string;
}

type ClaimStep = 'select' | 'form' | 'upload' | 'confirm';

export default function ClaimShopPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<ClaimStep>('select');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [unclaimedShops, setUnclaimedShops] = useState<Shop[]>([]);
  const [allUnclaimedShops, setAllUnclaimedShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
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
  const [formData, setFormData] = useState<ClaimFormData>({
    claimant_name: '',
    claimant_email: user?.email || '',
    claimant_phone: '',
    claimant_website: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
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

  // Fetch unclaimed shops on mount
  useEffect(() => {
    if (!authLoading && user) {
      fetchUnclaimedShops();
    }
  }, [authLoading, user]);

  const fetchUnclaimedShops = async () => {
    try {
      setLoading(true);
      // Fetch more shops to allow filtering
      const res = await fetch(`${apiUrl}/shops?unclaimed=true&page=1&limit=200`, {
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
        setAllUnclaimedShops(shopsArray);
        setUnclaimedShops(shopsArray);
      } else {
        console.error('Failed to fetch unclaimed shops');
        setAllUnclaimedShops([]);
        setUnclaimedShops([]);
      }
    } catch (error) {
      console.error('Error fetching unclaimed shops:', error);
      setAllUnclaimedShops([]);
      setUnclaimedShops([]);
    } finally {
      setLoading(false);
    }
  };

  // Get available prefectures based on selected region
  const availablePrefectures = useMemo(() => {
    if (selectedRegion === 'all') {
      return PREFECTURES;
    }
    const region = REGIONS.find(r => r.key === selectedRegion);
    if (!region) return [];
    return PREFECTURES.filter(p => region.prefectures.includes(p.key));
  }, [selectedRegion]);

  // Filter shops based on selected filters
  useEffect(() => {
    let filtered = [...allUnclaimedShops];

    // Search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(searchLower) ||
        (shop.address && shop.address.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shop => {
        // Check if shop's category_id matches selected category
        if (shop.category_id === selectedCategory) {
          return true;
        }
        // Also check category name if available
        const category = categories.find(c => c.id === selectedCategory);
        if (category && shop.subcategory) {
          return shop.subcategory.toLowerCase() === category.name.toLowerCase();
        }
        return false;
      });
    }

    // Prefecture filter
    if (selectedPrefecture !== 'all') {
      filtered = filtered.filter(shop => {
        const shopPrefecture = shop.prefecture || 
          (shop.address ? extractPrefecture({ address: shop.address }) : null);
        return shopPrefecture === selectedPrefecture;
      });
    }

    setUnclaimedShops(filtered);
  }, [debouncedSearch, selectedCategory, selectedPrefecture, allUnclaimedShops, categories]);

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    setStep('form');
    setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.claimant_name.trim() || !formData.claimant_email.trim()) {
      setError('Name and email are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.claimant_email)) {
      setError('Please enter a valid email address');
      return;
    }

    setStep('upload');
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      setError('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    // Limit to 3 files
    const totalFiles = uploadedFiles.length + files.length;
    if (totalFiles > 3) {
      setError('Maximum 3 files allowed');
      return;
    }

    // Limit file size (10MB per file)
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each file must be less than 10MB');
      return;
    }

    setUploadedFiles([...uploadedFiles, ...files]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const uploadFilesToStorage = async (): Promise<Array<{ path: string; name: string; size: number; type: string }>> => {
    if (uploadedFiles.length === 0) {
      return [];
    }

    if (!user || !selectedShop) {
      throw new Error('User or shop not selected');
    }

    setFileUploading(true);

    try {
      // Import Supabase storage utilities
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const bucket = 'shop-claims'; // Storage bucket name
      const basePath = `${selectedShop.id}/${user.id}`;

      const uploadedFilesData: Array<{ path: string; name: string; size: number; type: string }> = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `${basePath}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        uploadedFilesData.push({
          path: data.path,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      }

      return uploadedFilesData;
    } catch (error: any) {
      console.error('Error uploading files:', error);
      throw new Error(error.message || 'Failed to upload files');
    } finally {
      setFileUploading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedShop || !user) {
      setError('Shop or user not selected');
      return;
    }

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Upload files to storage
      const fileData = await uploadFilesToStorage();

      // Create claim request
      const res = await fetch(`${apiUrl}/shop-claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          shop_id: selectedShop.id,
          claimant_name: formData.claimant_name,
          claimant_email: formData.claimant_email,
          claimant_phone: formData.claimant_phone || null,
          claimant_website: formData.claimant_website || null,
          file_paths: fileData,
        }),
      });

      if (res.ok) {
        setStep('confirm');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to submit claim request');
      }
    } catch (error: any) {
      console.error('Error submitting claim:', error);
      setError(error.message || 'Failed to submit claim request');
    } finally {
      setSubmitting(false);
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
          {/* Step 1: Select Shop */}
          {step === 'select' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim a Shop</h1>
              <p className="text-gray-600 mb-6">
                Select a shop you want to claim. You'll need to provide proof documents.
              </p>

              {/* Filters */}
              <div className="mb-6 space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Shops
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by shop name or address..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Category, Region, Prefecture Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Region Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedPrefecture('all'); // Reset prefecture when region changes
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Regions</option>
                      {REGIONS.map((region) => (
                        <option key={region.key} value={region.key}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prefecture Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefecture
                    </label>
                    <select
                      value={selectedPrefecture}
                      onChange={(e) => setSelectedPrefecture(e.target.value)}
                      disabled={selectedRegion === 'all'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="all">All Prefectures</option>
                      {availablePrefectures.map((pref) => (
                        <option key={pref.key} value={pref.key}>
                          {pref.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600">
                  Showing {unclaimedShops.length} of {allUnclaimedShops.length} unclaimed shops
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
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading shops...</p>
                </div>
              ) : unclaimedShops.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No unclaimed shops available</p>
                  <p className="text-sm mt-2">All shops have been claimed.</p>
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
                            handleSelectShop(shop);
                          }}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Claim This Shop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Claim Form */}
          {step === 'form' && selectedShop && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Shop</h1>
                  <p className="text-gray-600">
                    Shop: <span className="font-semibold">{selectedShop.name}</span>
                  </p>
                  {selectedShop.address && (
                    <p className="text-sm text-gray-500 mt-1">{selectedShop.address}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedShop(null);
                    setFormData({
                      claimant_name: '',
                      claimant_email: user?.email || '',
                      claimant_phone: '',
                      claimant_website: '',
                    });
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Important:</p>
                <p className="text-sm text-yellow-700">
                  The documents you upload must clearly show this shop's name and address. They need to match what is displayed for this shop in YoyakuYo (name and address). Claims with mismatching names or addresses may be rejected.
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.claimant_name}
                    onChange={(e) => setFormData({ ...formData, claimant_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.claimant_email}
                    onChange={(e) => setFormData({ ...formData, claimant_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.claimant_phone}
                    onChange={(e) => setFormData({ ...formData, claimant_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+81 90-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Website <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.claimant_website}
                    onChange={(e) => setFormData({ ...formData, claimant_website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                  />
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {step === 'upload' && selectedShop && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
                  <p className="text-gray-600">
                    Shop: <span className="font-semibold">{selectedShop.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">📄 Document Requirements:</p>
                <p className="text-sm text-blue-700 mb-2">
                  Please upload one or more documents that prove you are connected to this shop.
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Business registration</li>
                  <li>Utility bill showing shop name and address</li>
                  <li>Shop card</li>
                  <li>Lease contract</li>
                  <li>Exterior photo with the shop sign</li>
                </ul>
                <p className="text-sm text-blue-700 mt-2 font-medium">
                  Accepted formats: JPG, PNG, PDF (max 3 files, 10MB each)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Documents (1-3 files)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {file.type.startsWith('image/') ? '🖼️' : '📄'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmitClaim}
                    disabled={uploadedFiles.length === 0 || submitting || fileUploading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting || fileUploading ? 'Submitting...' : 'Submit Claim Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Claim Submitted</h1>
              <div className="max-w-2xl mx-auto space-y-4 text-gray-600">
                <p className="text-lg">
                  Your claim has been submitted.
                </p>
                <p>
                  Our team will review the documents and verify that the shop name and address on your documents match this shop in YoyakuYo.
                </p>
                <p>
                  You will be notified when your claim is approved or rejected.
                </p>
              </div>
              <div className="mt-8">
                <button
                  onClick={() => router.push('/shops')}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to My Shops
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

