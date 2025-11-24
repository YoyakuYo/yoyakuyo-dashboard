// apps/dashboard/lib/supabaseClient.ts
// Browser/client Supabase instance for authentication

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance.
 * Uses lazy initialization to avoid errors during module load.
 * Forces re-initialization if env vars become available.
 */
export function getSupabaseClient(): SupabaseClient {
  // Only check env vars in the browser (runtime)
  if (typeof window !== "undefined") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Supabase Client Debug:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseAnonKey?.length || 0,
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
        keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing',
      });
    }

    // Check if we have valid env vars
    if (!supabaseUrl || !supabaseAnonKey) {
      // If we already have a placeholder client, return it
      if (supabaseInstance) {
        console.error(
          "❌ Supabase environment variables are missing!\n" +
          "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables.\n" +
          "Current values:\n" +
          `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'MISSING'}\n` +
          `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET (but may be invalid)' : 'MISSING'}`
        );
        return supabaseInstance;
      }

      // Create a dummy client that will fail gracefully when used
      console.warn(
        "⚠️ Supabase environment variables are missing!\n" +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables.\n" +
        "The app will continue to load, but authentication features will not work."
      );
      
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
      return supabaseInstance;
    }

    // If we have valid env vars but client was initialized with placeholders, re-initialize
    if (supabaseInstance) {
      const currentUrl = (supabaseInstance as any).supabaseUrl;
      if (currentUrl === "https://placeholder.supabase.co" || currentUrl !== supabaseUrl) {
        console.log('🔄 Re-initializing Supabase client with valid credentials');
        supabaseInstance = null; // Clear cached instance
      }
    }

    // Return existing instance if it's already valid
    if (supabaseInstance) {
      return supabaseInstance;
    }

    // Create real client with actual credentials
    console.log('✅ Initializing Supabase client with valid credentials');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  }

  // During SSR/build, return a placeholder client
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
  }
  return supabaseInstance;
}

// Export a getter that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    
    // If it's a function, bind it to the client
    if (typeof value === "function") {
      return value.bind(client);
    }
    
    return value;
  },
});


