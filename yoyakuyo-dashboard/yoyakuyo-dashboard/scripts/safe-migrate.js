// scripts/safe-migrate.js
// Safe migration script that checks existing schema before applying changes

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// scripts/ lives at repoRoot/scripts, migrations live at repoRoot/supabase/migrations
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

console.log('🛡️  Safe Migration Process\n');

// Step 1: Pull current schema
console.log('📥 Step 1: Pulling current Supabase schema...');
try {
  execSync('npx supabase db pull', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..') 
  });
  console.log('✅ Schema pulled successfully\n');
} catch (error) {
  console.error('❌ Failed to pull schema:', error.message);
  console.log('\n💡 Make sure you are logged in and linked:');
  console.log('   npx supabase login');
  console.log('   npx supabase link');
  process.exit(1);
}

// Step 2: Generate diff
console.log('🔍 Step 2: Detecting schema changes...');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const migrationName = `auto_migration_${timestamp}`;

try {
  execSync(`npx supabase db diff -f "${migrationName}" --local`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Diff generated\n');
} catch (error) {
  console.log('⚠️  No changes detected or diff failed\n');
  process.exit(0);
}

// Step 3: Find the generated migration file
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.includes(migrationName) && f.endsWith('.sql'))
  .sort()
  .reverse();

if (migrationFiles.length === 0) {
  console.log('✅ No schema changes detected. Database is up-to-date!');
  process.exit(0);
}

const migrationFile = path.join(MIGRATIONS_DIR, migrationFiles[0]);
console.log(`📝 Generated migration: ${migrationFiles[0]}\n`);

// Step 4: Preview migration
console.log('📋 Migration preview (first 30 lines):');
console.log('─'.repeat(60));
const content = fs.readFileSync(migrationFile, 'utf8');
const lines = content.split('\n').slice(0, 30);
console.log(lines.join('\n'));
if (content.split('\n').length > 30) {
  console.log(`\n... (${content.split('\n').length - 30} more lines)`);
}
console.log('─'.repeat(60));
console.log('');

// Step 5: Push migration
console.log('🚀 Step 3: Pushing migration to Supabase...');
try {
  execSync('npx supabase db push', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('\n✅ Migration successfully applied!');
  console.log(`📝 Migration file: ${migrationFiles[0]}`);
} catch (error) {
  console.error('\n❌ Failed to push migration:', error.message);
  console.log(`\n💡 Review the migration file: ${migrationFiles[0]}`);
  process.exit(1);
}

