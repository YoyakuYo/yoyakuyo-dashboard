// scripts/check-schema.js
// Check existing schema in Supabase before creating migrations
// Prevents duplicate table/column creation

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Supabase schema...\n');

try {
  // Pull current schema from Supabase
  console.log('📥 Pulling current schema from Supabase...');
  execSync('npx supabase db pull', { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  
  console.log('\n✅ Schema check complete!');
  console.log('💡 Review the schema files in supabase/ directory');
  console.log('💡 Only create migrations for NEW changes that don\'t exist in the schema');
} catch (error) {
  console.error('\n❌ Error checking schema:', error.message);
  console.log('\n💡 Make sure you are:');
  console.log('   1. Logged in: npx supabase login');
  console.log('   2. Linked to project: npx supabase link');
  process.exit(1);
}

