// Script to create admin user in Supabase Auth and owners table
// Usage: node scripts/create-admin-auth.js
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

// Load environment variables from yoyakuyo-api/.env
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../yoyakuyo-api/.env') });
// Also try root .env as fallback
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Admin credentials
const adminEmail = 'sowoumar45@gmail.com';
const adminPassword = 'Sowbarcelone4545';
const adminName = 'Admin User';

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user in Supabase Auth...\n');

    // Step 1: Check if user already exists in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
    );

    let userId;
    if (existingUser) {
      console.log(`✅ User already exists in auth.users with ID: ${existingUser.id}`);
      userId = existingUser.id;
      
      // Update password if needed
      console.log('🔄 Updating password...');
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError.message);
        throw updateError;
      }
      console.log('✅ Password updated successfully');
    } else {
      // Step 2: Create user in Supabase Auth
      console.log('📝 Creating new user in auth.users...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: adminName,
        },
      });

      if (authError || !authData?.user) {
        console.error('❌ Error creating auth user:', authError);
        throw authError || new Error('Failed to create user');
      }

      userId = authData.user.id;
      console.log(`✅ User created in auth.users with ID: ${userId}`);
    }

    // Step 3: Create or update owner record
    console.log('\n📋 Creating/updating owner record...');
    
    // Check if owner exists
    const { data: existingOwner, error: checkError } = await supabaseAdmin
      .from('owners')
      .select('id, email, role')
      .eq('email', adminEmail.toLowerCase().trim())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking owner:', checkError);
      throw checkError;
    }

    if (existingOwner) {
      // Update existing owner
      console.log(`📝 Updating existing owner record (ID: ${existingOwner.id})...`);
      const { data: updateOwner, error: updateOwnerError } = await supabaseAdmin
        .from('owners')
        .update({
          id: userId, // Ensure ID matches auth.users
          role: 'admin',
          name: adminName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOwner.id)
        .select()
        .single();

      if (updateOwnerError) {
        console.error('❌ Error updating owner:', updateOwnerError);
        throw updateOwnerError;
      }
      console.log('✅ Owner record updated successfully');
    } else {
      // Create new owner
      console.log('📝 Creating new owner record...');
      const { data: newOwner, error: createOwnerError } = await supabaseAdmin
        .from('owners')
        .insert({
          id: userId,
          email: adminEmail.toLowerCase().trim(),
          name: adminName,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createOwnerError) {
        console.error('❌ Error creating owner:', createOwnerError);
        throw createOwnerError;
      }
      console.log('✅ Owner record created successfully');
    }

    // Step 4: Verify
    console.log('\n✅ Verification:');
    const { data: verifyOwner, error: verifyError } = await supabaseAdmin
      .from('owners')
      .select('id, email, name, role')
      .eq('email', adminEmail.toLowerCase().trim())
      .single();

    if (verifyError) {
      console.error('❌ Error verifying owner:', verifyError);
    } else {
      console.log('   Owner ID:', verifyOwner.id);
      console.log('   Email:', verifyOwner.email);
      console.log('   Name:', verifyOwner.name);
      console.log('   Role:', verifyOwner.role);
    }

    console.log('\n✅ Admin account setup complete!');
    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('\nYou can now log in at /admin/login');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

createAdminUser();

