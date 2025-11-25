// scripts/pre-migration-check.js
// Run this BEFORE creating any migration to check existing schema
// Prevents duplicate table/column creation

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../../supabase/migrations');

console.log('🛡️  Pre-Migration Schema Check\n');
console.log('This script checks existing schema to prevent duplicate migrations.\n');

// Check if Supabase is linked
try {
  execSync('npx supabase status', { 
    stdio: 'pipe',
    cwd: path.join(__dirname, '../..')
  });
} catch (error) {
  console.log('⚠️  Supabase project not linked or not logged in.\n');
  console.log('💡 Run these commands first:');
  console.log('   1. npm run supabase:login');
  console.log('   2. npm run supabase:link\n');
  process.exit(1);
}

// Pull current schema
console.log('📥 Pulling current schema from Supabase...');
try {
  execSync('npx supabase db pull', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '../..')
  });
  console.log('\n✅ Schema pulled successfully!\n');
} catch (error) {
  console.error('\n❌ Failed to pull schema:', error.message);
  process.exit(1);
}

// List existing migrations
console.log('📋 Existing migrations:');
const migrations = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (migrations.length === 0) {
  console.log('   (no migrations found)\n');
} else {
  migrations.forEach(m => console.log(`   - ${m}`));
  console.log(`\n   Total: ${migrations.length} migrations\n`);
}

console.log('✅ Pre-migration check complete!');
console.log('💡 Review the schema files in supabase/ directory');
console.log('💡 Only create migrations for NEW changes\n');

