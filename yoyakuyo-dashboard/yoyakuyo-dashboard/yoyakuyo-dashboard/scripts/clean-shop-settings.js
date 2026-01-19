// Clean up shop_settings.closed_days to remove non-date values
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanShopSettings() {
  console.log('Cleaning shop_settings.closed_days...');

  // Get all shop settings
  const { data: settings, error } = await supabase
    .from('shop_settings')
    .select('id, shop_id, closed_days');

  if (error) {
    console.error('Error fetching shop settings:', error);
    return;
  }

  console.log(`Found ${settings?.length || 0} shop settings records`);

  for (const setting of settings || []) {
    if (setting.closed_days && Array.isArray(setting.closed_days)) {
      // Filter to only keep valid date strings (YYYY-MM-DD format)
      const cleaned = setting.closed_days.filter(day => {
        return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day);
      });

      if (cleaned.length !== setting.closed_days.length) {
        console.log(`Cleaning shop ${setting.shop_id}:`);
        console.log(`  Before: ${JSON.stringify(setting.closed_days)}`);
        console.log(`  After:  ${JSON.stringify(cleaned)}`);

        // Update the record
        const { error: updateError } = await supabase
          .from('shop_settings')
          .update({ closed_days: cleaned })
          .eq('id', setting.id);

        if (updateError) {
          console.error(`Error updating shop ${setting.shop_id}:`, updateError);
        } else {
          console.log(`✅ Updated shop ${setting.shop_id}`);
        }
      }
    }
  }

  console.log('Cleanup complete!');
}

cleanShopSettings().catch(console.error);
