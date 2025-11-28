const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper port configuration
  // Port is set via command line: next start -p 3001
};

module.exports = withNextIntl(nextConfig);

