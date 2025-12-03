const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper port configuration
  // Port is set via command line: next start -p 3001
  
  // Allow external images from Unsplash and other sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      // Hotels & Stays images
      {
        protocol: 'https',
        hostname: 'besthotelshome.com',
      },
      {
        protocol: 'https',
        hostname: '**.tumblr.com',
      },
      {
        protocol: 'https',
        hostname: 'misstourist.com',
      },
      {
        protocol: 'https',
        hostname: 'urbanpixxels.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.vogue.com',
      },
      {
        protocol: 'https',
        hostname: 'www.hotelsinheaven.com',
      },
      // Clinics & Medical Care images
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs.dreamstime.com',
      },
      {
        protocol: 'https',
        hostname: 'c8.alamy.com',
      },
      {
        protocol: 'https',
        hostname: 'www.womensclinicofatlanta.com',
      },
      {
        protocol: 'https',
        hostname: 'www.rappler.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'treesforhealth.org',
      },
      {
        protocol: 'https',
        hostname: 'as1.ftcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'graziamagazine.com',
      },
      {
        protocol: 'https',
        hostname: 'www.aesthetic-clinics.co.uk',
      },
    ],
    unoptimized: false,
  },
  
  // Exclude API and other apps directories from Next.js compilation
  webpack: (config, { isServer }) => {
    // Exclude apps/api, apps/dashboard, yoyakuyo-api, and yoyakuyo-dashboard from compilation
    // Safely handle watchOptions.ignored - it might be undefined, a string, an array, or other types
    if (!config.watchOptions) {
      config.watchOptions = {};
    }
    
    const existingIgnored = config.watchOptions.ignored;
    let ignoredArray = [];
    
    if (Array.isArray(existingIgnored)) {
      ignoredArray = existingIgnored;
    } else if (existingIgnored) {
      // If it's a string or other non-array value, wrap it in an array
      ignoredArray = [existingIgnored];
    }
    // If undefined/null, ignoredArray stays as empty array
    
    config.watchOptions.ignored = [
      ...ignoredArray,
      '**/apps/api/**',
      '**/apps/dashboard/**',
      '**/yoyakuyo-api/**',
      '**/yoyakuyo-dashboard/**',
    ];
    
    return config;
  },
};

module.exports = withNextIntl(nextConfig);

