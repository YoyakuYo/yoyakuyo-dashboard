import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

interface Shop {
  id: string;
  address?: string;
  prefecture?: string;
  normalized_city?: string;
  city?: string;
}

async function handleMissingCityData({ dryRun = true }: { dryRun?: boolean }) {
  console.log(`🚀 Starting script to handle missing city data. Dry run: ${dryRun}`);
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  while (hasMore) {
    const { data: shops, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('id, address, prefecture, normalized_city, city, claim_status')
      .is('city', null)  // Only shops missing city
      .or('claim_status.is.null,claim_status.not.eq.hidden')  // Visible shops
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching shops:', fetchError);
      return;
    }

    for (const shop of shops) {
      processed++;
      let newCity: string | null = null;

      // Logic: Prioritize normalized_city, then extract from address, then from prefecture
      if (shop.normalized_city && shop.normalized_city.trim() !== '') {
        newCity = shop.normalized_city;
      } else if (shop.address) {
        // Simple extraction logic (expand as needed)
        const words = shop.address.split(' ');
        newCity = words.find((word: string) => word.match(/[a-zA-Z]+/)) || null;  // Basic word match
      } else if (shop.prefecture) {
        newCity = shop.prefecture + ' City';  // Fallback: e.g., 'Tokyo City'
      }

      if (newCity && !dryRun) {
        const { error: updateError } = await supabaseAdmin
          .from('shops')
          .update({ city: newCity })
          .eq('id', shop.id);

        if (updateError) {
          console.error(`❌ Error updating shop ${shop.id}:`, updateError);
          skipped++;
        } else {
          updated++;
        }
      } else if (newCity) {
        console.log(`Would update shop ${shop.id} with city: ${newCity}`);
        updated++;  // For dry run counting
      } else {
        skipped++;
        console.log(`No city found for shop ${shop.id}`);
      }
    }

    offset += batchSize;
    hasMore = shops.length === batchSize;
  }

  console.log(`✨ Script complete: Processed ${processed} shops, Updated ${updated}, Skipped ${skipped}`);
}

(async () => {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  await handleMissingCityData({ dryRun });
})();
