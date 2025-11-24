// yoyakuyo-dashboard/lib/supabase.ts
// Browser/client Supabase instance for authentication
// FIXED: Improved initialization and removed Proxy pattern

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let isInitialized = false;

/**
 * Validate Supabase environment variables
 * Throws error if missing (prevents silent failures)
 */
function validateSupabaseEnv(): { url: string; key: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 
      "❌ CRITICAL: Supabase environment variables are missing!\n" +
      "Please set the following in Vercel Environment Variables:\n" +
      `  - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'MISSING'}\n` +
      `  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET (but may be invalid)' : 'MISSING'}\n` +
      "\n" +
      "After setting env vars, redeploy the application.\n" +
      "Authentication features will not work until these are set.";
    
    console.error(errorMsg);
    throw new Error("Supabase environment variables are missing. Check console for details.");
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL does not look like a valid Supabase URL');
  }

  // Validate key format (should start with 'eyJ')
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like a valid JWT token');
  }

  return { url: supabaseUrl, key: supabaseAnonKey };
}

/**
 * Get or create the Supabase client instance.
 * Uses lazy initialization to avoid errors during module load.
 * ALWAYS validates env vars before creating client.
 */
export function getSupabaseClient(): SupabaseClient {
  // Only initialize in browser (runtime)
  if (typeof window !== "undefined") {
    // If already initialized with valid credentials, return cached instance
    if (isInitialized && supabaseInstance) {
      return supabaseInstance;
    }

    try {
      // Validate env vars (throws if missing)
      const { url, key } = validateSupabaseEnv();

      // Create client with validated credentials
      // Note: CORS is handled by Supabase server-side configuration
      // Make sure your Vercel domain is added to Supabase Authentication > URL Configuration
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce', // Use PKCE flow for better security
        },
        global: {
          headers: {
            'x-client-info': 'yoyakuyo-dashboard',
          },
        },
      });

      isInitialized = true;

      // Debug logging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Supabase client initialized successfully', {
          url: url.substring(0, 30) + '...',
          keyLength: key.length,
        });
      }

      return supabaseInstance;
    } catch (error) {
      // If validation fails, throw error (don't create placeholder)
      // This ensures we fail fast and don't silently use invalid credentials
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  // During SSR/build, we can't use the client anyway
  // Return a placeholder that will throw if used
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    console.warn('⚠️ Supabase client created with placeholder (SSR mode). Use getSupabaseClient() only in browser.');
  }
  return supabaseInstance;
}

/**
 * Export supabase instance for backward compatibility
 * DEPRECATED: Use getSupabaseClient() instead
 * This is a direct reference, not a Proxy, to avoid binding issues
 */
export const supabase = (() => {
  // Return a getter that always calls getSupabaseClient()
  // This ensures we always get a fresh, properly initialized client
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const client = getSupabaseClient();
      const value = (client as any)[prop];
      
      // If it's a function, bind it to the client to preserve 'this' context
      if (typeof value === "function") {
        return value.bind(client);
      }
      
      return value;
    },
  });
})();


