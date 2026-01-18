// scripts/check-and-create-shop-settings.js
// Check if shop_settings table exists, and create it if not

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables the same way the API does
require('dotenv').config({ path: path.join(__dirname, '..', 'yoyakuyo-api', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking shop_settings table...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ set' : '❌ missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ set' : '❌ missing');
  console.log('\n💡 Check your yoyakuyo-api/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateTable() {
  try {
    // Check if table exists by trying to select from it
    const { error: selectError } = await supabase
      .from('shop_settings')
      .select('id')
      .limit(1);

    if (selectError && selectError.code === 'PGRST116') {
      console.log('📝 shop_settings table does not exist. Creating...');

      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS shop_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          shop_id UUID NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
          working_hours JSONB DEFAULT '{
            "monday": {"open": "09:00", "close": "18:00"},
            "tuesday": {"open": "09:00", "close": "18:00"},
            "wednesday": {"open": "09:00", "close": "18:00"},
            "thursday": {"open": "09:00", "close": "18:00"},
            "friday": {"open": "09:00", "close": "18:00"},
            "saturday": {"open": "09:00", "close": "18:00"},
            "sunday": {"open": null, "close": null}
          }'::jsonb,
          closed_days TEXT[] DEFAULT ARRAY['sunday'],
          buffer_time_minutes INTEGER DEFAULT 15,
          auto_confirm_bookings BOOLEAN DEFAULT FALSE,
          ai_enabled BOOLEAN DEFAULT TRUE,
          ai_auto_reply BOOLEAN DEFAULT FALSE,
          notify_new_booking BOOLEAN DEFAULT TRUE,
          notify_booking_cancellation BOOLEAN DEFAULT TRUE,
          notify_new_message BOOLEAN DEFAULT TRUE,
          calendar_sync_enabled BOOLEAN DEFAULT FALSE,
          calendar_provider TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (createError) {
        console.error('❌ Error creating table with RPC, trying direct SQL...');

        // Try direct SQL execution
        const { error: directError } = await supabase
          .from('shops')
          .select('*')
          .limit(1); // Just to test connection

        if (directError) {
          console.error('❌ Cannot connect to database:', directError.message);
          console.log('💡 You may need to run this SQL manually in your Supabase dashboard:');
          console.log(createTableSQL);
          process.exit(1);
        } else {
          console.log('💡 RPC not available. Please run this SQL manually in Supabase SQL editor:');
          console.log(createTableSQL);
          process.exit(1);
        }
      }

      console.log('✅ shop_settings table created successfully!');

      // Create index
      const indexSQL = 'CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_id ON shop_settings(shop_id);';
      await supabase.rpc('exec_sql', { sql: indexSQL });

      // Enable RLS
      const rlsSQL = 'ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;';
      await supabase.rpc('exec_sql', { sql: rlsSQL });

      console.log('✅ Index and RLS enabled!');

    } else if (!selectError) {
      console.log('✅ shop_settings table already exists!');

      // Check if closed_days column exists
      const { data: sampleData, error: columnError } = await supabase
        .from('shop_settings')
        .select('closed_days')
        .limit(1);

      if (columnError) {
        console.error('❌ closed_days column missing. Table may be incomplete.');
        console.log('💡 You may need to add the closed_days column manually.');
      } else {
        console.log('✅ closed_days column exists!');
      }

    } else {
      console.error('❌ Unexpected error checking table:', selectError.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

checkAndCreateTable();
