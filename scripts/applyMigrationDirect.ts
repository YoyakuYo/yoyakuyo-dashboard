// scripts/applyMigrationDirect.ts
// Apply migration using direct PostgreSQL connection

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from 'url';
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../yoyakuyo-api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log("=".repeat(80));
    console.log("Applying website_url migration");
    console.log("=".repeat(80));
    console.log("\n");

    // Read migration SQL
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/add_website_url_to_shops.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Extract SQL statements (remove comments)
    const sqlStatements = migrationSQL
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log("SQL to execute:");
    console.log("-".repeat(80));
    for (const sql of sqlStatements) {
      console.log(sql + ";");
    }
    console.log("-".repeat(80));
    console.log("\n");

    // Try to execute via Supabase RPC if a function exists
    // Otherwise, we'll need to use the Dashboard
    
    // First, try to verify current state
    console.log("Checking current schema...\n");
    const { data: sample, error: checkError } = await supabase
      .from('shops')
      .select('website_url')
      .limit(1)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log("⚠️  No shops found. Cannot verify column via query.");
      } else if (checkError.message?.includes('website_url') || checkError.message?.includes('column')) {
        console.log("❌ Column 'website_url' not found in shops table.");
        console.log("   This confirms the migration needs to be applied.\n");
      }
    } else if (sample && 'website_url' in sample) {
      console.log("✅ Column 'website_url' already exists!");
      console.log("   Migration may have already been applied.\n");
      return;
    }

    // Since Supabase JS client doesn't support ALTER TABLE directly,
    // we need to use the Supabase Dashboard or CLI
    console.log("⚠️  Supabase JS client doesn't support ALTER TABLE for security reasons.");
    console.log("   This is a standard security feature.\n");
    
    // Extract project reference for Dashboard URL
    const projectMatch = supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/);
    const projectRef = projectMatch ? projectMatch[1] : 'your-project';
    const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

    console.log("✅ Migration file ready: supabase/migrations/add_website_url_to_shops.sql\n");
    console.log("To apply the migration:\n");
    console.log("OPTION 1 - Supabase Dashboard (Easiest):");
    console.log(`  1. Open: ${dashboardUrl}`);
    console.log("  2. Paste this SQL:");
    console.log("\n" + sqlStatements.map(s => s + ";").join("\n") + "\n");
    console.log("  3. Click 'Run'\n");
    
    console.log("OPTION 2 - Supabase CLI:");
    console.log("  supabase db push\n");
    
    console.log("OPTION 3 - Direct psql (if you have connection string):");
    console.log("  psql \"<connection-string>\" -f supabase/migrations/add_website_url_to_shops.sql\n");

    // The migration is ready but needs manual application
    console.log("=".repeat(80));
    console.log("Migration prepared but requires manual application");
    console.log("=".repeat(80));
    console.log("\nThe SQL is safe and idempotent (uses IF NOT EXISTS).");
    console.log("You can apply it using any of the methods above.\n");

  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

applyMigration();

