const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper port configuration
  // Port is set via command line: next start -p 3001
  
  // Exclude API and other apps directories from Next.js compilation
  webpack: (config, { isServer }) => {
    // Exclude apps/api, apps/dashboard, yoyakuyo-api, and yoyakuyo-dashboard from compilation
    const existingIgnored = config.watchOptions?.ignored;
    const ignoredArray = Array.isArray(existingIgnored) 
      ? existingIgnored 
      : (existingIgnored ? [existingIgnored] : []);
    
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...ignoredArray,
        '**/apps/api/**',
        '**/apps/dashboard/**',
        '**/yoyakuyo-api/**',
        '**/yoyakuyo-dashboard/**',
      ],
    };
    
    return config;
  },
};

module.exports = withNextIntl(nextConfig);

