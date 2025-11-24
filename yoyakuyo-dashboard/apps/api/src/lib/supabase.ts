import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Only load .env file if it exists (for local development)
// In Vercel, environment variables are set in the dashboard
if (process.env.NODE_ENV !== 'production') {
  try {
    dotenv.config({ 
      path: path.resolve(__dirname, "../../.env") 
    });
  } catch (error) {
    // Ignore if .env file doesn't exist
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("⚠️ SUPABASE_URL is missing from environment variables");
  if (process.env.NODE_ENV === 'production') {
    console.error("Please set SUPABASE_URL in Vercel environment variables");
  }
  // Don't throw in production - let it fail gracefully when used
}

if (!supabaseKey) {
  console.error("⚠️ SUPABASE_ANON_KEY is missing from environment variables");
  if (process.env.NODE_ENV === 'production') {
    console.error("Please set SUPABASE_ANON_KEY in Vercel environment variables");
  }
  // Don't throw in production - let it fail gracefully when used
}

// Create Supabase clients only if we have the required environment variables
// Use placeholder values if missing to prevent immediate crash
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

// Service role client for admin operations (e.g., generating signed URLs)
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
