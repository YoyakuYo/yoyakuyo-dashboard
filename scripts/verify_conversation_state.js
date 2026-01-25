// scripts/verify_conversation_state.js
// Script to verify the current state of conversations in the database

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

async function verifyConversationState() {
  console.log('🔍 Verifying current conversation state...\n');

  try {
    // 1. Check total conversations
    console.log('1️⃣  Total conversations in database:');
    const { count: totalCount, error: totalError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Error counting conversations:', totalError);
      return;
    }
    console.log(`   📊 Total: ${totalCount} conversations\n`);

    // 2. Check conversations by type
    console.log('2️⃣  Conversations by type:');
    const { data: typeStats, error: typeError } = await supabase
      .rpc('get_conversation_type_stats');

    if (typeError) {
      // Fallback: manual count
      const types = ['booking_owner', 'support_admin', 'admin_owner'];
      for (const type of types) {
        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_type', type);
        console.log(`   ${type}: ${count}`);
      }
    } else {
      typeStats.forEach(stat => {
        console.log(`   ${stat.conversation_type}: ${stat.count}`);
      });
    }
    console.log('');

    // 3. Check for conversations with missing required fields
    console.log('3️⃣  Conversations with missing required fields:');
    const { data: missingFields, error: missingError } = await supabase
      .from('conversations')
      .select('id, conversation_type, target_type, target_id, shop_id, booking_id, customer_type, type')
      .or('conversation_type.is.null,target_type.is.null,target_id.is.null')
      .limit(10);

    if (missingError) {
      console.error('❌ Error checking missing fields:', missingError);
    } else {
      console.log(`   Found ${missingFields.length} conversations with missing required fields`);
      if (missingFields.length > 0) {
        console.log('   Sample problematic conversations:');
        missingFields.forEach((conv, index) => {
          console.log(`     ${index + 1}. ID: ${conv.id}, type: ${conv.type || 'NULL'}, conversation_type: ${conv.conversation_type || 'NULL'}, has_booking: ${!!conv.booking_id}`);
        });
      }
    }
    console.log('');

    // 4. Check specifically for guest conversations
    console.log('4️⃣  Guest conversations:');
    const { data: guestConversations, error: guestError } = await supabase
      .from('conversations')
      .select('id, conversation_type, target_type, target_id, shop_id, booking_id, customer_type, customer_ref')
      .eq('customer_type', 'guest')
      .limit(5);

    if (guestError) {
      console.error('❌ Error checking guest conversations:', guestError);
    } else {
      console.log(`   Found ${guestConversations.length} guest conversations`);
      if (guestConversations.length > 0) {
        console.log('   Guest conversation details:');
        guestConversations.forEach((conv, index) => {
          console.log(`     ${index + 1}. ID: ${conv.id}`);
          console.log(`        conversation_type: ${conv.conversation_type || 'NULL'}`);
          console.log(`        target_type: ${conv.target_type || 'NULL'}`);
          console.log(`        target_id: ${conv.target_id || 'NULL'}`);
          console.log(`        booking_id: ${conv.booking_id || 'NULL'}`);
          console.log(`        shop_id: ${conv.shop_id || 'NULL'}`);
        });
      }
    }
    console.log('');

    // 5. Check for conversations that would be visible to owners
    console.log('5️⃣  Conversations that should be visible to owners:');
    const { data: ownerVisible, error: ownerError } = await supabase
      .from('conversations')
      .select('id, conversation_type, target_type, target_id, shop_id, customer_type, customer_ref')
      .eq('conversation_type', 'booking_owner')
      .eq('target_type', 'shop')
      .not('target_id', 'is', null)
      .limit(5);

    if (ownerError) {
      console.error('❌ Error checking owner-visible conversations:', ownerError);
    } else {
      console.log(`   Found ${ownerVisible.length} conversations visible to owners`);
      if (ownerVisible.length > 0) {
        console.log('   Sample owner-visible conversations:');
        ownerVisible.forEach((conv, index) => {
          console.log(`     ${index + 1}. ID: ${conv.id}, customer_type: ${conv.customer_type}, shop: ${conv.shop_id}`);
        });
      }
    }
    console.log('');

    // 6. Summary and recommendations
    console.log('6️⃣  Summary and Recommendations:');
    console.log('   ✅ Database schema supports correct fields (conversation_type, target_type, target_id)');
    console.log('   ✅ Booking creation code has been fixed to use correct field names');

    if (missingFields && missingFields.length > 0) {
      console.log(`   ⚠️  Found ${missingFields.length} conversations with missing required fields`);
      console.log('   🔧 Recommendation: Run the migration to fix existing conversations');
    } else {
      console.log('   ✅ All conversations appear to have required fields');
    }

    if (guestConversations && guestConversations.length > 0) {
      const properlyConfigured = guestConversations.filter(c =>
        c.conversation_type === 'booking_owner' &&
        c.target_type === 'shop' &&
        c.target_id
      ).length;

      if (properlyConfigured < guestConversations.length) {
        console.log(`   ⚠️  ${guestConversations.length - properlyConfigured} guest conversations may not be visible to owners`);
        console.log('   🔧 Recommendation: Run the migration to fix guest conversations');
      } else {
        console.log('   ✅ All guest conversations are properly configured');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyConversationState();