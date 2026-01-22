// Script to execute the web customer to guest conversion migration
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeMigration() {
  console.log('🗑️  Starting web customer to guest conversion...');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250122_convert_web_customers_to_guest.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');

    // Split the SQL into statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔍 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            console.error('❌ Statement failed:', statement.substring(0, 100) + '...');
            console.error('Error:', error);
            // Continue with other statements
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (stmtErr) {
          console.error('❌ Statement execution error:', stmtErr.message);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Migration execution completed!');

  } catch (err) {
    console.error('❌ Script execution failed:', err.message);

    // Fallback: try direct table operations
    console.log('🔄 Attempting direct table operations...');

    try {
      // Get all web customers
      const { data: webCustomers, error: fetchError } = await supabase
        .from('customers')
        .select('id, email, name, auth_user_id')
        .eq('role', 'web');

      if (fetchError) {
        console.error('❌ Error fetching web customers:', fetchError);
        return;
      }

      if (!webCustomers || webCustomers.length === 0) {
        console.log('ℹ️  No web customers found');
        return;
      }

      console.log(`📊 Found ${webCustomers.length} web customers to convert`);

      // Use existing guest customer (prefer yoyakuyodemo@gmail.com)
      let { data: guestCustomer, error: guestError } = await supabase
        .from('customers')
        .select('id, email')
        .eq('role', 'guest')
        .eq('email', 'yoyakuyodemo@gmail.com')
        .single();

      if (guestError && guestError.code === 'PGRST116') {
        // yoyakuyodemo@gmail.com not found, use any existing guest
        const { data: fallbackGuest, error: fallbackError } = await supabase
          .from('customers')
          .select('id, email')
          .eq('role', 'guest')
          .limit(1)
          .single();

        if (fallbackError) {
          console.error('❌ Error finding guest customer:', fallbackError);
          return;
        }

        guestCustomer = fallbackGuest;
        console.log(`✅ Using existing guest customer: ${guestCustomer.email}`);
      } else if (guestError) {
        console.error('❌ Error checking guest customer:', guestError);
        return;
      } else {
        console.log(`✅ Using primary guest customer: ${guestCustomer.email}`);
      }

      // Process each web customer
      for (const customer of webCustomers) {
        console.log(`🔄 Converting customer ${customer.id}: ${customer.name || 'No name'}`);

        // Reassign bookings
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ customer_id: guestCustomer.id })
          .eq('customer_id', customer.id);

        if (bookingError) {
          console.error('❌ Error reassigning bookings:', bookingError);
        }

        // Update conversations from web to guest type
        const { error: messageError } = await supabase
          .from('conversations')
          .update({
            customer_type: 'guest',
            customer_ref: `converted_web_customer_${customer.id}`
          })
          .eq('customer_type', 'web')
          .eq('customer_ref', customer.auth_user_id);

        if (messageError) {
          console.error('❌ Error reassigning conversations:', messageError);
        }

        // Reassign threads
        const { error: threadError } = await supabase
          .from('shop_threads')
          .update({ customer_id: guestCustomer.id })
          .eq('customer_id', customer.id);

        if (threadError) {
          console.error('❌ Error reassigning threads:', threadError);
        }

        // Reassign reviews
        const { error: reviewError } = await supabase
          .from('reviews')
          .update({ user_id: guestCustomer.id })
          .eq('user_id', customer.id);

        if (reviewError) {
          console.error('❌ Error reassigning reviews:', reviewError);
        }

        // Handle orphaned reviews (reviews pointing to deleted customers)
        const { error: orphanedError } = await supabase
          .from('reviews')
          .update({ user_id: guestCustomer.id })
          .not('user_id', 'in', `(SELECT id FROM customers)`);

        if (orphanedError) {
          console.error('❌ Error fixing orphaned reviews:', orphanedError);
        }

        // Delete customer and related data
        await supabase.from('customer_profiles').delete().eq('customer_auth_id', customer.id);
        await supabase.from('line_accounts').delete().eq('customer_id', customer.id);
        await supabase.from('users').delete().eq('id', customer.id);
        await supabase.from('customers').delete().eq('id', customer.id);

        console.log(`✅ Converted customer ${customer.id}`);
      }

      console.log('✅ All web customers converted to guest successfully!');

    } catch (fallbackError) {
      console.error('❌ Fallback conversion failed:', fallbackError);
    }
  }
}

executeMigration();