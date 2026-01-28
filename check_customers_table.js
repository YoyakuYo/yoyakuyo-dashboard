const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './yoyakuyo-api/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCustomers() {
  console.log('=== CUSTOMERS TABLE ANALYSIS ===\n');

  // Check customer role distribution
  const { data: roleStats, error: roleError } = await supabase
    .from('customers')
    .select('role, auth_user_id, line_user_id, email, id, name')
    .limit(1000);

  if (roleError) {
    console.error('Error fetching customers:', roleError);
    return;
  }

  console.log('Total customers:', roleStats.length);

  // Analyze by role
  const byRole = roleStats.reduce((acc, customer) => {
    const role = customer.role || 'null';
    if (!acc[role]) acc[role] = { count: 0, with_auth: 0, with_line: 0, with_email: 0 };
    acc[role].count++;
    if (customer.auth_user_id) acc[role].with_auth++;
    if (customer.line_user_id) acc[role].with_line++;
    if (customer.email) acc[role].with_email++;
    return acc;
  }, {});

  console.log('\n=== CUSTOMERS BY ROLE ===');
  Object.entries(byRole).forEach(([role, stats]) => {
    console.log(`${role}: ${stats.count} total (${stats.with_auth} with auth_user_id, ${stats.with_line} with line_user_id, ${stats.with_email} with email)`);
  });

  // Check for web customers (should NOT be in customers table)
  const webCustomers = roleStats.filter(c => c.role === 'web' || (c.auth_user_id && !c.line_user_id && c.role !== 'line'));
  if (webCustomers.length > 0) {
    console.log('\n⚠️  WARNING: Found customers that appear to be web/authenticated users:');
    webCustomers.slice(0, 10).forEach(c => {
      console.log(`  ID: ${c.id}, Role: ${c.role}, Auth: ${c.auth_user_id}, Line: ${c.line_user_id}, Email: ${c.email}, Name: ${c.name}`);
    });
    if (webCustomers.length > 10) console.log(`  ... and ${webCustomers.length - 10} more`);
  } else {
    console.log('\n✅ No web/authenticated customers found in customers table');
  }

  // Check for proper guest customers
  const guestCustomers = roleStats.filter(c => c.role === 'guest');
  console.log('\n=== GUEST CUSTOMERS SAMPLE ===');
  guestCustomers.slice(0, 5).forEach(c => {
    console.log(`  ID: ${c.id}, Auth: ${c.auth_user_id}, Line: ${c.line_user_id}, Email: ${c.email}, Name: ${c.name}`);
  });

  // Check for proper LINE customers
  const lineCustomers = roleStats.filter(c => c.role === 'line');
  console.log('\n=== LINE CUSTOMERS SAMPLE ===');
  lineCustomers.slice(0, 5).forEach(c => {
    console.log(`  ID: ${c.id}, Auth: ${c.auth_user_id}, Line: ${c.line_user_id}, Email: ${c.email}, Name: ${c.name}`);
  });

  // Check customers table structure
  console.log('\n=== CUSTOMERS TABLE STRUCTURE ===');
  const { data: structure, error: structError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers'
        ORDER BY ordinal_position;
      `
    });

  if (!structError) {
    console.log('Columns:');
    structure.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
  }

  // Check if there are authenticated users in auth.users that shouldn't be in customers
  console.log('\n=== CHECKING FOR AUTH USERS IN CUSTOMERS (SHOULD BE EMPTY) ===');
  const { data: authUsersInCustomers, error: authError } = await supabase
    .from('customers')
    .select('id, auth_user_id, role, email')
    .not('auth_user_id', 'is', null);

  if (!authError && authUsersInCustomers) {
    if (authUsersInCustomers.length > 0) {
      console.log('❌ FOUND AUTH USERS IN CUSTOMERS TABLE (this violates the unified architecture):');
      authUsersInCustomers.forEach(c => {
        console.log(`  Customer ID: ${c.id}, Auth User ID: ${c.auth_user_id}, Role: ${c.role}, Email: ${c.email}`);
      });
    } else {
      console.log('✅ No authenticated users found in customers table (correct)');
    }
  }
}

checkCustomers().catch(console.error);