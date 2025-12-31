// apps/dashboard/lib/supabaseClient.ts
// Browser/client Supabase instance for authentication

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance.
 * Uses lazy initialization to avoid errors during module load.
 */
export function getSupabaseClient(): SupabaseClient {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Only check env vars in the browser (runtime)
  if (typeof window !== "undefined") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Create a dummy client that will fail gracefully when used
      // This prevents the app from crashing on load
      console.warn(
        "⚠️ Supabase environment variables are missing!\n" +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/dashboard/.env.local\n" +
        "The app will continue to load, but authentication features will not work."
      );
      
      // Return a client with placeholder values - it will fail when actually used
      // but won't crash the app on import
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

    // Create real client with actual credentials
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  }

  // During SSR/build, return a placeholder client
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


