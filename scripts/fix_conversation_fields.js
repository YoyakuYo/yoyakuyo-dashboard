// scripts/fix_conversation_fields.js
// Script to fix existing conversations with wrong field names

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixConversationFields() {
  console.log('🔧 Fixing existing conversation fields...\n');

  try {
    // Check current state
    console.log('📊 Checking current conversation state...');
    const { data: beforeCheck, error: beforeError } = await supabase
      .from('conversations')
      .select('id, conversation_type, target_type, target_id, type, shop_id, booking_id, customer_type')
      .limit(5);

    if (beforeError) {
      console.error('❌ Error checking conversations:', beforeError);
      return;
    }

    console.log('Before fix - sample conversations:');
    console.table(beforeCheck);

    // Find conversations that need fixing
    const { data: conversationsToFix, error: findError } = await supabase
      .from('conversations')
      .select('id, type, shop_id, booking_id, customer_type')
      .is('conversation_type', null)
      .not('shop_id', 'is', null)
      .not('booking_id', 'is', null);

    if (findError) {
      console.error('❌ Error finding conversations to fix:', findError);
      return;
    }

    console.log(`\n🔍 Found ${conversationsToFix.length} conversations that need fixing`);

    if (conversationsToFix.length === 0) {
      console.log('✅ No conversations need fixing - all are already correct');
      return;
    }

    // Fix the conversations
    console.log('\n🛠️  Applying fixes...');

    const { data: updatedConversations, error: updateError } = await supabase
      .from('conversations')
      .update({
        conversation_type: 'booking_owner',
        target_type: 'shop',
        target_id: supabase.sql`shop_id::text`
      })
      .is('conversation_type', null)
      .not('shop_id', 'is', null)
      .not('booking_id', 'is', null)
      .select('id, conversation_type, target_type, target_id, shop_id');

    if (updateError) {
      console.error('❌ Error updating conversations:', updateError);
      return;
    }

    console.log(`✅ Successfully fixed ${updatedConversations.length} conversations`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: afterCheck, error: afterError } = await supabase
      .from('conversations')
      .select('id, conversation_type, target_type, target_id, shop_id, booking_id, customer_type')
      .eq('conversation_type', 'booking_owner')
      .eq('target_type', 'shop')
      .limit(5);

    if (afterError) {
      console.error('❌ Error verifying fix:', afterError);
      return;
    }

    console.log('After fix - sample conversations:');
    console.table(afterCheck);

    // Final count
    const { count: totalFixed, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_type', 'booking_owner')
      .eq('target_type', 'shop')
      .not('target_id', 'is', null);

    if (!countError) {
      console.log(`\n📈 Total conversations with correct fields: ${totalFixed}`);
    }

    console.log('\n🎉 Conversation field fix completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixConversationFields();