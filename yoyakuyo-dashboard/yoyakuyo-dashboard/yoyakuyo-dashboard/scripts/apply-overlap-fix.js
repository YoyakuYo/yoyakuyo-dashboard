// Script to apply the overlap detection fix directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../yoyakuyo-api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env file in yoyakuyo-api/');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyOverlapFix() {
  console.log('🔧 Applying overlap detection fix...');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260111_fix_overlap_detection.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If rpc doesn't work, try direct query
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase.from('availability_windows').select('count').limit(1);
      if (directError) {
        console.error('❌ Database connection failed:', directError.message);
        return;
      }

      // For now, just log that we need to apply manually
      console.log('⚠️  Direct SQL execution not available via RPC');
      console.log('📋 Please run this SQL manually in your Supabase SQL editor:');
      console.log('─'.repeat(60));
      console.log(migrationSQL);
      console.log('─'.repeat(60));
      return;
    }

    console.log('✅ Overlap detection fix applied successfully!');
  } catch (err) {
    console.error('❌ Failed to apply migration:', err.message);
    console.log('📋 Please run this SQL manually in your Supabase SQL editor:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
  }
}

applyOverlapFix();
