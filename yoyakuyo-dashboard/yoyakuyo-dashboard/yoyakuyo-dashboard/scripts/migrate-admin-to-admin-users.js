// Script to migrate existing admin account from owners to admin_users table
// Usage: node scripts/migrate-admin-to-admin-users.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const adminEmail = 'sowoumar45@gmail.com';

async function migrateAdmin() {
  console.log('🔄 Migrating admin account to admin_users table...\n');

  try {
    // Step 1: Find admin user in auth.users
    console.log('📋 Step 1: Finding admin user in auth.users...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }

    const adminAuthUser = users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
    
    if (!adminAuthUser) {
      console.error(`❌ Admin user not found in auth.users with email: ${adminEmail}`);
      console.log('💡 Make sure the admin account exists in Supabase Auth first.');
      process.exit(1);
    }

    console.log(`✅ Found admin user in auth.users: ${adminAuthUser.id} (${adminAuthUser.email})`);

    // Step 2: Check if already exists in admin_users
    console.log('\n📋 Step 2: Checking if admin already exists in admin_users...');
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', adminAuthUser.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking admin_users:', checkError);
      process.exit(1);
    }

    if (existingAdmin) {
      console.log('✅ Admin already exists in admin_users table');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Status: ${existingAdmin.status}`);
      return;
    }

    // Step 3: Insert into admin_users
    console.log('\n📋 Step 3: Creating admin record in admin_users table...');
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: adminAuthUser.id,
        email: adminAuthUser.email,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating admin user:', insertError);
      process.exit(1);
    }

    console.log('✅ Admin account successfully migrated to admin_users table!');
    console.log(`\n📊 Admin Details:`);
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   Status: ${newAdmin.status}`);
    console.log(`\n✅ Migration complete! You can now log in at /admin/login`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

migrateAdmin();

