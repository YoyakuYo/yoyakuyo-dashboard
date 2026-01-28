// Test the admin analytics customers API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const USER_ID = process.env.TEST_USER_ID || 'your-admin-user-id-here';

async function testAnalyticsAPI() {
  try {
    console.log('Testing API endpoint:', `${API_URL}/admin/analytics/customers`);
    console.log('Using user ID:', USER_ID);

    const response = await fetch(`${API_URL}/admin/analytics/customers`, {
      headers: {
        'x-user-id': USER_ID,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response data:');
      console.log('Customers count:', data.customers?.length || 0);
      console.log('Customer roles:', data.customerRoles);
      console.log('Active customer IDs count:', data.activeCustomerIds?.length || 0);

      const lineCustomers = data.customers?.filter(c => c.role === 'line') || [];
      console.log('LINE customers found:', lineCustomers.length);

      if (lineCustomers.length > 0) {
        console.log('Sample LINE customers:');
        lineCustomers.slice(0, 3).forEach(customer => {
          console.log(`- ${customer.name || 'No name'} (${customer.id}) - LINE ID: ${customer.line_user_id}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAnalyticsAPI();