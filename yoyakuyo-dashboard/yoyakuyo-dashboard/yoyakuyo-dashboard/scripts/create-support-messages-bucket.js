// Script to create the support-messages storage bucket in Supabase
// Run with: node scripts/create-support-messages-bucket.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Add them to .env.local or set them as environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  console.log('🪣 Creating support-messages storage bucket...');

  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = existingBuckets?.some(b => b.id === 'support-messages');
    
    if (bucketExists) {
      console.log('✅ Bucket "support-messages" already exists!');
      return;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('support-messages', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      console.error('');
      console.error('If you see a permission error, create it manually:');
      console.error('1. Go to Supabase Dashboard → Storage');
      console.error('2. Click "New bucket"');
      console.error('3. Name: support-messages');
      console.error('4. Public: false (unchecked)');
      console.error('5. File size limit: 10MB');
      console.error('6. Allowed MIME types:');
      console.error('   - application/pdf');
      console.error('   - image/jpeg');
      console.error('   - image/jpg');
      console.error('   - image/png');
      console.error('   - application/msword');
      console.error('   - application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      return;
    }

    console.log('✅ Bucket "support-messages" created successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run the migration to create storage policies:');
    console.log('   supabase/migrations/20260104000001_create_support_messages_bucket.sql');
    console.log('2. Or the policies will be created automatically if you run migrations');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createBucket();

