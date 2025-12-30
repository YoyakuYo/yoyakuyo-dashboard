// apps/dashboard/scripts/download-final-images.js
// Download final missing images

const https = require('https');
const fs = require('fs');
const path = require('path');

const missing = [
  { 
    key: 'dental', 
    urls: [
      'https://images.pexels.com/photos/3845553/pexels-photo-3845553.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1606811971618-4486c81c8e0a?w=1920&h=1080&fit=crop',
    ]
  },
  { 
    key: 'womens-clinic', 
    urls: [
      'https://images.pexels.com/photos/3845553/pexels-photo-3845553.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=1080&fit=crop',
    ]
  },
];

const categoriesDir = path.join(__dirname, '../public/categories');

function downloadImage(category) {
  return new Promise((resolve, reject) => {
    let urlIndex = 0;
    
    const tryDownload = (url) => {
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

async function downloadFinal() {
  for (const cat of missing) {
    try {
      await downloadImage(cat);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`⚠️  Could not download ${cat.key}.jpg`);
    }
  }
  console.log('\n✨ All images downloaded!');
}

downloadFinal();

