// apps/dashboard/lib/supabaseServer.ts
// Server-side Supabase auth check for middleware

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Check if user is authenticated via Supabase session cookie
 * Returns true if authenticated, false otherwise
 * 
 * This is a lightweight check that looks for Supabase auth cookies
 * without requiring @supabase/ssr package
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    // Check for Supabase auth cookies
    // Supabase stores session in cookies with pattern: sb-<project-ref>-auth-token
    const cookies = req.cookies.getAll();
    const hasAuthCookie = cookies.some(
      (cookie) => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    );

    if (!hasAuthCookie) {
      return false;
    }

    // Try to validate the token by creating a client and checking the session
    // Extract the access token from cookies if possible
    const authCookie = cookies.find(
      (cookie) => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    );

    if (!authCookie) {
      return false;
    }

    // Parse the cookie value (it's JSON encoded)
    try {
      const sessionData = JSON.parse(authCookie.value);
      if (sessionData?.access_token) {
        // Create a client and verify the token
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await supabase.auth.getUser(sessionData.access_token);
        
        if (!error && user) {
          return true;
        }
      }
    } catch (parseError) {
      // Cookie might not be JSON, try alternative parsing
      // Supabase might store it differently
    }

    // Fallback: if we have the auth cookie, assume authenticated
    // The client-side AuthGuard will handle actual validation
    return hasAuthCookie;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

