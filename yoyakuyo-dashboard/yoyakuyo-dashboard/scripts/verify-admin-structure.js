// Script to verify admin structure in Supabase
// Shows how admins are structured with the role-based approach

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAdminStructure() {
  console.log('\n🔍 Verifying Admin Structure in Supabase...\n');
  console.log('='.repeat(60));

  try {
    // 1. Check if admin user exists in auth.users
    console.log('\n1️⃣ Checking auth.users for admin email...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const adminUser = authUsers?.users?.find(u => u.email === 'sowoumar45@gmail.com');
    
    if (adminUser) {
      console.log('✅ Admin user found in auth.users:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Created: ${adminUser.created_at}`);
    } else {
      console.log('❌ Admin user NOT found in auth.users');
      return;
    }

    // 2. Check customers table structure
    console.log('\n2️⃣ Checking customers table structure...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', adminUser.id)
      .limit(1);

    if (customersError) {
      console.error('❌ Error querying customers:', customersError);
      return;
    }

    if (customers && customers.length > 0) {
      const customer = customers[0];
      console.log('✅ Customer record found:');
      console.log(`   Customer ID (UUID): ${customer.id}`);
      console.log(`   Auth User ID: ${customer.auth_user_id}`);
      console.log(`   Role: ${customer.role}`);
      console.log(`   is_admin: ${customer.is_admin}`);
      console.log(`   Created: ${customer.created_at}`);
      
      if (customer.is_admin) {
        console.log('\n✅ ✅ ✅ ADMIN FLAG IS SET CORRECTLY! ✅ ✅ ✅');
      } else {
        console.log('\n❌ ❌ ❌ ADMIN FLAG IS NOT SET! ❌ ❌ ❌');
        console.log('   The migration may not have run, or the admin was not migrated.');
      }
    } else {
      console.log('❌ No customer record found for admin user');
      console.log('   The migration should have created one. Checking if migration ran...');
    }

    // 3. Check all admins
    console.log('\n3️⃣ Checking all customers with is_admin = true...');
    const { data: allAdmins, error: adminsError } = await supabase
      .from('customers')
      .select('id, auth_user_id, role, is_admin, created_at')
      .eq('is_admin', true);

    if (adminsError) {
      console.error('❌ Error querying admins:', adminsError);
    } else {
      console.log(`✅ Found ${allAdmins?.length || 0} admin(s) in customers table:`);
      if (allAdmins && allAdmins.length > 0) {
        for (const admin of allAdmins) {
          // Get email from auth.users
          const { data: authUser } = await supabase.auth.admin.getUserById(admin.auth_user_id);
          console.log(`   - ${authUser?.user?.email || 'Unknown'} (auth_user_id: ${admin.auth_user_id}, role: ${admin.role})`);
        }
      }
    }

    // 4. Check customers table columns
    console.log('\n4️⃣ Customers table structure:');
    const { data: columns } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'customers'
        ORDER BY ordinal_position;
      `
    }).catch(() => null);

    if (!columns) {
      // Fallback: just describe what we know
      console.log('   Columns (from code):');
      console.log('   - id (UUID, primary key, generated)');
      console.log('   - auth_user_id (UUID, references auth.users.id)');
      console.log('   - role (customer_role enum: guest, web, line)');
      console.log('   - is_admin (BOOLEAN, default false)');
      console.log('   - created_at (timestamptz)');
    }

    // 5. Check if admins table exists
    console.log('\n5️⃣ Checking if deprecated admins table exists...');
    const { data: tableCheck } = await supabase.rpc('exec_sql', {
      query: `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admins'
        ) as exists;
      `
    }).catch(() => null);

    if (tableCheck) {
      console.log(`   ${tableCheck[0]?.exists ? '⚠️  admins table still exists (deprecated)' : '✅ admins table does not exist (correct)'}`);
    } else {
      console.log('   (Could not check - this is OK)');
    }

    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Admin user in auth.users: ${adminUser ? 'YES' : 'NO'}`);
    console.log(`✅ Customer record exists: ${customers && customers.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ is_admin flag set: ${customers && customers[0]?.is_admin ? 'YES' : 'NO'}`);
    console.log(`✅ Total admins in system: ${allAdmins?.length || 0}`);
    
    if (customers && customers[0]?.is_admin) {
      console.log('\n✅ ✅ ✅ ADMIN STRUCTURE IS CORRECT! ✅ ✅ ✅');
      console.log('\nThe admin should be able to log in now.');
    } else {
      console.log('\n❌ ❌ ❌ ADMIN STRUCTURE NEEDS FIXING ❌ ❌ ❌');
      console.log('\nTo fix: Run this SQL in Supabase:');
      console.log(`
UPDATE customers 
SET is_admin = true 
WHERE auth_user_id = '${adminUser.id}';

-- Or if customer doesn't exist:
INSERT INTO customers (role, is_admin, auth_user_id, created_at)
VALUES ('web'::customer_role, true, '${adminUser.id}', NOW())
ON CONFLICT (auth_user_id) DO UPDATE SET is_admin = true;
      `);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyAdminStructure();

