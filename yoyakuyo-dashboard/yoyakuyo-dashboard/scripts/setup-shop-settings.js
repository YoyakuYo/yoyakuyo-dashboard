// scripts/setup-shop-settings.js
// Manually create shop_settings table using existing Supabase connection

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupShopSettings() {
  console.log('🛠️  Setting up shop_settings table...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-shop-settings-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }

    console.log('✅ shop_settings table created successfully!');
    console.log('✅ Closed days functionality should now work properly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

setupShopSettings();
