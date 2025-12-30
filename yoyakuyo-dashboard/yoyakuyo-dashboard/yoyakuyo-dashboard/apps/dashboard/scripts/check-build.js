// Check if production build exists before starting
const fs = require('fs');
const path = require('path');

const buildIdPath = path.join(__dirname, '../.next/BUILD_ID');

if (!fs.existsSync(buildIdPath)) {
  console.error('\n❌ Production build not found!');
  console.error('   Run: npm run build');
  console.error('   Or use: npm run dev (for development)\n');
  process.exit(1);
}

console.log('✅ Production build found');

