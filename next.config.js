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
        hostname: 'twomonkeystravelgroup.com',
      },
      {
        protocol: 'https',
        hostname: 'www.agoda.com',
      },
      {
        protocol: 'https',
        hostname: 'media.cntraveler.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.s.forbestravelguide.com',
      },
      {
        protocol: 'https',
        hostname: 'stories-editor.hilton.com',
      },
      // Clinics & Medical Care images
      {
        protocol: 'https',
        hostname: 'tse1.explicit.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'midcitihospital.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'preview.redd.it',
      },
      {
        protocol: 'https',
        hostname: 'www.liveenhanced.com',
      },
      // Beauty Services images
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'barb.pro',
      },
      {
        protocol: 'https',
        hostname: 'styleyouroccasion.com',
      },
      {
        protocol: 'https',
        hostname: 'comfortel.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbs.dreamstime.com',
      },
      {
        protocol: 'https',
        hostname: 'forreslocal.com',
      },
      {
        protocol: 'https',
        hostname: 'blogz.my',
      },
      // Spa, Onsen & Relaxation images
      {
        protocol: 'https',
        hostname: 'anaicbeppu.com',
      },
      {
        protocol: 'https',
        hostname: 'www.onsen.co.nz',
      },
      {
        protocol: 'https',
        hostname: 'nzhotpools.co.nz',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'tse2.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'goodspaguide--live.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },
      // Dining & Izakaya images
      {
        protocol: 'https',
        hostname: 'www.willflyforfood.net',
      },
      {
        protocol: 'https',
        hostname: 'media-cdn.tripadvisor.com',
      },
      {
        protocol: 'https',
        hostname: 'media.timeout.com',
      },
      {
        protocol: 'https',
        hostname: 'www.hankyu-hotel.com',
      },
      {
        protocol: 'https',
        hostname: 'th.bing.com',
      },
      {
        protocol: 'https',
        hostname: 'a.cdn-hotels.com',
      },
      // Activities & Sports images
      {
        protocol: 'https',
        hostname: 'thegolfdome.com',
      },
      {
        protocol: 'https',
        hostname: 'www.indoorgolfarena.eu',
      },
      {
        protocol: 'https',
        hostname: 'www.theteenmagazine.com',
      },
      {
        protocol: 'https',
        hostname: 'uploads-ssl.webflow.com',
      },
      {
        protocol: 'https',
        hostname: 'www.bodysmart.com.au',
      },
      {
        protocol: 'https',
        hostname: 'nfg-sofun.s3.amazonaws.com',
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

