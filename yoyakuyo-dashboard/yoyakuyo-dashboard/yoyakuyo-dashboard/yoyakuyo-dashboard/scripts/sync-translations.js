const fs = require('fs');
const path = require('path');

// Recursively get all keys from an object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Set a value in a nested object using dot notation
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

// Get a value from a nested object using dot notation
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object' || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

// Main function
function syncTranslations() {
  const messagesDir = path.join(__dirname, '..', 'messages');
  const languages = ['en', 'ja', 'zh', 'es', 'pt-BR'];
  
  // Load English as the source of truth
  const enPath = path.join(messagesDir, 'en.json');
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeys = getAllKeys(enContent);
  
  console.log(`English has ${enKeys.length} keys`);
  
  // Process each language
  for (const lang of languages) {
    if (lang === 'en') continue; // Skip English
    
    const langPath = path.join(messagesDir, `${lang}.json`);
    let langContent = {};
    
    // Load existing translations
    if (fs.existsSync(langPath)) {
      langContent = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }
    
    let addedCount = 0;
    let missingKeys = [];
    
    // Check for missing keys
    for (const key of enKeys) {
      const value = getNestedValue(langContent, key);
      if (value === undefined) {
        const enValue = getNestedValue(enContent, key);
        setNestedValue(langContent, key, enValue); // Use English as placeholder
        addedCount++;
        missingKeys.push(key);
      }
    }
    
    // Write updated file
    fs.writeFileSync(langPath, JSON.stringify(langContent, null, 2) + '\n', 'utf8');
    
    console.log(`\n${lang.toUpperCase()}:`);
    console.log(`  Added ${addedCount} missing keys`);
    if (missingKeys.length > 0 && missingKeys.length <= 10) {
      console.log(`  Missing keys: ${missingKeys.join(', ')}`);
    } else if (missingKeys.length > 10) {
      console.log(`  First 10 missing keys: ${missingKeys.slice(0, 10).join(', ')}...`);
    }
  }
  
  console.log('\n✅ Translation sync complete!');
}

syncTranslations();

