// apps/dashboard/scripts/download-missing-images.js
// Download missing category images

const https = require('https');
const fs = require('fs');
const path = require('path');

const missing = [
  { 
    key: 'hair-salon', 
    urls: [
      'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3992206/pexels-photo-3992206.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'barber', 
    urls: [
      'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b7d?w=1920&h=1080&fit=crop',
      'https://images.pexels.com/photos/3992206/pexels-photo-3992206.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    ]
  },
];

const categoriesDir = path.join(__dirname, '../public/categories');

function downloadImage(category) {
  return new Promise((resolve, reject) => {
    let urlIndex = 0;
    
    const tryDownload = (url) => {
      const urlObj = new URL(url);
      const filePath = path.join(categoriesDir, `${category.key}.jpg`);
      const file = fs.createWriteStream(filePath);
      
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(filePath);
            if (stats.size > 1000) {
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
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          tryNext();
        }
      }).on('error', () => {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        tryNext();
      });
    };
    
    const tryNext = () => {
      urlIndex++;
      if (urlIndex < category.urls.length) {
        console.log(`  Trying fallback ${urlIndex + 1}...`);
        tryDownload(category.urls[urlIndex]);
      } else {
        console.log(`❌ Failed ${category.key}.jpg`);
        reject();
      }
    };
    
    console.log(`Downloading ${category.key}.jpg...`);
    tryDownload(category.urls[0]);
  });
}

async function downloadMissing() {
  for (const cat of missing) {
    try {
      await downloadImage(cat);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`⚠️  Could not download ${cat.key}.jpg`);
    }
  }
  console.log('\n✨ Done!');
}

downloadMissing();

