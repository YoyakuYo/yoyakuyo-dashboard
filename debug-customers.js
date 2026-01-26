// Quick debug script to check what customers exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomers() {
  try {
    console.log('Checking customers...');

    // Get all customers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, role, line_user_id, auth_user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    console.log(`Found ${customers.length} customers:`);
    customers.forEach(customer => {
      console.log(`- ${customer.name || 'No name'} (${customer.role}) - ID: ${customer.id} - LINE: ${customer.line_user_id || 'N/A'}`);
    });

    // Check specifically for LINE customers
    const lineCustomers = customers.filter(c => c.role === 'line');
    console.log(`\nLINE customers: ${lineCustomers.length}`);
    lineCustomers.forEach(customer => {
      console.log(`- ${customer.name || 'No name'} - LINE ID: ${customer.line_user_id}`);
    });

    // Check for specific LINE user ID
    const specificUser = customers.find(c => c.line_user_id === 'Uf5741397f874c9a5822578e506f0cb47');
    if (specificUser) {
      console.log(`\nFound specific LINE user Uf5741397f874c9a5822578e506f0cb47:`);
      console.log(`- Name: ${specificUser.name}`);
      console.log(`- Role: ${specificUser.role}`);
      console.log(`- ID: ${specificUser.id}`);
    } else {
      console.log('\nSpecific LINE user Uf5741397f874c9a5822578e506f0cb47 not found in customers table');
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

checkCustomers();