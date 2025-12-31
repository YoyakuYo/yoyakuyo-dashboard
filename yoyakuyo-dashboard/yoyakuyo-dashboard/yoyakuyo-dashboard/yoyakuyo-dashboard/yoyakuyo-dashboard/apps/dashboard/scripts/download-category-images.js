// apps/dashboard/scripts/download-category-images.js
// Downloads category images from multiple free sources

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const categories = [
  { 
    key: 'restaurant', 
    urls: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'hotel', 
    urls: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'hair-salon', 
    urls: [
      'https://images.unsplash.com/photo-1560066984-138dadb4e035?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'barber', 
    urls: [
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b7d?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'nails', 
    urls: [
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3992206/pexels-photo-3992206.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'eyelash', 
    urls: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3992206/pexels-photo-3992206.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'onsen', 
    urls: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'spa', 
    urls: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'beauty-salon', 
    urls: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3992206/pexels-photo-3992206.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'dental', 
    urls: [
      'https://images.unsplash.com/photo-1606811971618-4486c81c8e0a?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3845553/pexels-photo-3845553.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'womens-clinic', 
    urls: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3845553/pexels-photo-3845553.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'golf', 
    urls: [
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/163236/luxury-golf-sport-trophy-163236.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'karaoke', 
    urls: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
];

const categoriesDir = path.join(__dirname, '../public/categories');

// Ensure directory exists
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
}

// Download image from URL with fallback
function downloadImage(category) {
  return new Promise((resolve, reject) => {
    let urlIndex = 0;
    
    const tryDownload = (url) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const filePath = path.join(categoriesDir, `${category.key}.jpg`);
      const file = fs.createWriteStream(filePath);
      
      const request = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (response) => {
        if (response.statusCode === 200 || response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            file.close();
            fs.unlinkSync(filePath);
            return tryDownload(response.headers.location);
          }
          
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(filePath);
            if (stats.size > 1000) { // At least 1KB
              console.log(`✅ Downloaded ${category.key}.jpg (${(stats.size / 1024).toFixed(1)}KB)`);
              resolve();
            } else {
              file.close();
              fs.unlinkSync(filePath);
              tryNext();
            }
          });
        } else {
          file.close();
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          tryNext();
        }
      });
      
      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        tryNext();
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        tryNext();
      });
    };
    
    const tryNext = () => {
      urlIndex++;
      if (urlIndex < category.urls.length) {
        console.log(`  Trying fallback ${urlIndex + 1} for ${category.key}...`);
        tryDownload(category.urls[urlIndex]);
      } else {
        console.log(`❌ Failed to download ${category.key}.jpg from all sources`);
        reject(new Error('All sources failed'));
      }
    };
    
    console.log(`Downloading ${category.key}.jpg...`);
    tryDownload(category.urls[0]);
  });
}

// Download all images sequentially with delay
async function downloadAll() {
  console.log('🚀 Starting image downloads from Unsplash/Pexels...\n');
  
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    try {
      await downloadImage(category);
      // Small delay between downloads to avoid rate limiting
      if (i < categories.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.log(`⚠️  Skipping ${category.key}.jpg due to error`);
    }
  }
  
  console.log('\n✨ Download complete!');
  console.log(`📁 Images saved to: ${categoriesDir}`);
  
  // List downloaded files
  const files = fs.readdirSync(categoriesDir).filter(f => f.endsWith('.jpg'));
  console.log(`\n📸 Downloaded ${files.length} images:`);
  files.forEach(file => {
    const stats = fs.statSync(path.join(categoriesDir, file));
    console.log(`   - ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  });
}

downloadAll().catch(console.error);
