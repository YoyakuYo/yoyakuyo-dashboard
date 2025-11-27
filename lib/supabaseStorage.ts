// lib/supabaseStorage.ts
// Utility functions for Supabase Storage operations

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseStorage = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path in storage
 * @param file - File object to upload
 * @returns Public URL or path to the uploaded file
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string; url?: string }> {
  const { data, error } = await supabaseStorage.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseStorage.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadFiles(
  bucket: string,
  files: File[],
  basePath: string
): Promise<Array<{ path: string; name: string; size: number; type: string; url?: string }>> {
  const uploadPromises = files.map(async (file, index) => {
    const fileName = `${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${basePath}/${fileName}`;
    
    const result = await uploadFile(bucket, filePath, file);
    
    return {
      path: result.path,
      name: file.name,
      size: file.size,
      type: file.type,
      url: result.url,
    };
  });

  return Promise.all(uploadPromises);
}

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabaseStorage.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

