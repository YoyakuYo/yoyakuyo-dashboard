import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

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

export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for admin operations (e.g., generating signed URLs)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
