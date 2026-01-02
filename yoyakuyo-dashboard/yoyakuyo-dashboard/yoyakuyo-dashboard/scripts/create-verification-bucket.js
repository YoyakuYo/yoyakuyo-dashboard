// scripts/create-verification-bucket.js
// Script to create verification-documents storage bucket
// Run with: node scripts/create-verification-bucket.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.error('You can find it in: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucket() {
  console.log('🪣 Creating verification-documents storage bucket...');

  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = existingBuckets?.some(b => b.id === 'verification-documents');
    
    if (bucketExists) {
      console.log('✅ Bucket "verification-documents" already exists!');
      return;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('verification-documents', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
      ]
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      console.error('');
      console.error('If you see a permission error, try creating it manually:');
      console.error('1. Go to Supabase Dashboard → Storage');
      console.error('2. Click "New bucket"');
      console.error('3. Name: verification-documents');
      console.error('4. Public: false');
      console.error('5. File size limit: 10MB');
      console.error('6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, application/pdf');
      return;
    }

    console.log('✅ Bucket "verification-documents" created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run the migration to create storage policies:');
    console.log('   supabase/migrations/20250106030000_create_verification_documents_bucket.sql');
    console.log('2. Or set up policies manually in Supabase Dashboard → Storage → Policies');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createBucket();

