// Script to execute the customer deletion migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeMigration() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available. Check environment variables.');
    process.exit(1);
  }

  console.log('🗑️  Executing customer deletion migration...');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250122_delete_misclassified_web_customer.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('🔍 Executing migration...');

    // Execute the migration
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);

      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative execution method...');

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabaseAdmin.rpc('exec_sql', {
              sql: statement + ';'
            });

            if (stmtError) {
              console.error('❌ Statement failed:', statement.substring(0, 100) + '...');
              console.error('Error:', stmtError);
            } else {
              console.log('✅ Statement executed successfully');
            }
          } catch (stmtErr) {
            console.error('❌ Statement execution error:', stmtErr.message);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
      console.log('📊 Result:', data);
    }

  } catch (err) {
    console.error('❌ Script execution failed:', err.message);

    // Fallback: try direct table operations
    console.log('🔄 Attempting direct table operations...');

    const customerId = '78fea290-ef9a-43c8-96d6-90460c04efe5';

    try {
      // Check if customer exists
      const { data: customer, error: checkError } = await supabaseAdmin
        .from('customers')
        .select('id, role')
        .eq('id', customerId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking customer:', checkError);
        return;
      }

      if (!customer) {
        console.log('ℹ️  Customer already deleted or does not exist');
        return;
      }

      console.log(`🗑️  Deleting customer ${customerId} (role: ${customer.role})`);

      // Delete in order of dependencies
      await supabaseAdmin.from('messages').delete().eq('customer_id', customerId);
      await supabaseAdmin.from('threads').delete().eq('customer_id', customerId);
      await supabaseAdmin.from('reviews').delete().eq('user_id', customerId);
      await supabaseAdmin.from('bookings').delete().eq('customer_id', customerId);
      await supabaseAdmin.from('line_accounts').delete().eq('customer_id', customerId);
      await supabaseAdmin.from('customer_profiles').delete().eq('customer_auth_id', customerId);
      await supabaseAdmin.from('users').delete().eq('id', customerId);
      await supabaseAdmin.from('customers').delete().eq('id', customerId);

      // Try to delete from auth.users (this might fail if there are dependencies)
      try {
        await supabaseAdmin.auth.admin.deleteUser(customerId);
        console.log('✅ Auth user deleted');
      } catch (authError) {
        console.log('⚠️  Could not delete auth user (might have dependencies):', authError.message);
      }

      console.log('✅ Customer and all related data deleted successfully!');

    } catch (fallbackError) {
      console.error('❌ Fallback deletion failed:', fallbackError);
    }
  }
}

executeMigration();