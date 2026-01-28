const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './yoyakuyo-api/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBookingsStructure() {
  console.log('=== BOOKINGS TABLE STRUCTURE ===');

  const { data: columns, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'bookings'
        ORDER BY ordinal_position;
      `
    });

  if (!error && columns) {
    columns.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
  }

  // Check recent bookings to see what customer_id values look like
  console.log('\n=== RECENT BOOKINGS SAMPLE ===');
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id, customer_id, customer_email, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!bookingError && bookings) {
    bookings.forEach(booking => {
      console.log(`Booking: ${booking.id}, Customer: ${booking.customer_id}, Email: ${booking.customer_email}`);
    });
  }

  // Check if these customer_ids exist in customers table
  console.log('\n=== CHECKING IF BOOKING CUSTOMERS EXIST IN CUSTOMERS TABLE ===');
  if (bookings && bookings.length > 0) {
    const customerIds = bookings.map(b => b.customer_id);
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, role, auth_user_id, line_user_id, email')
      .in('id', customerIds);

    if (!custError && customers) {
      console.log('Customer lookup results:');
      customers.forEach(cust => {
        console.log(`  Customer ${cust.id}: Role=${cust.role}, Auth=${cust.auth_user_id}, Line=${cust.line_user_id}, Email=${cust.email}`);
      });

      const missing = customerIds.filter(id => !customers.find(c => c.id === id));
      if (missing.length > 0) {
        console.log(`❌ Missing customers in customers table: ${missing.join(', ')}`);
      } else {
        console.log('✅ All booking customers exist in customers table');
      }
    }
  }
}

checkBookingsStructure().catch(console.error);