// apps/api/src/services/languageDetectionService.ts
// Multi-language detection service using OpenAI and heuristics

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Language code to language name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  'ja': 'Japanese',
  'en': 'English',
  'zh': 'Chinese',
  'vi': 'Vietnamese',
  'pt': 'Portuguese',
  'fr': 'French',
  'ru': 'Russian',
  'es': 'Spanish',
  'ko': 'Korean',
  'th': 'Thai',
  'de': 'German',
  'it': 'Italian',
  'ar': 'Arabic',
  'hi': 'Hindi',
};

// Language code to flag emoji mapping
export const LANGUAGE_FLAGS: Record<string, string> = {
  'ja': '🇯🇵',
  'en': '🇺🇸',
  'zh': '🇨🇳',
  'vi': '🇻🇳',
  'pt': '🇵🇹',
  'fr': '🇫🇷',
  'ru': '🇷🇺',
  'es': '🇪🇸',
  'ko': '🇰🇷',
  'th': '🇹🇭',
  'de': '🇩🇪',
  'it': '🇮🇹',
  'ar': '🇸🇦',
  'hi': '🇮🇳',
};

/**
 * Detect language from text using OpenAI
 * Returns ISO 639-1 language code (e.g., 'ja', 'en', 'zh', 'vi', etc.)
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English
  }

  // Quick heuristic checks first (faster, no API call)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    // Check if it's Japanese (hiragana/katakana) or Chinese (kanji)
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
      return 'ja'; // Japanese (has hiragana/katakana)
    }
    return 'zh'; // Chinese (only kanji/hanzi)
  }
  
  if (/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(text)) {
    return 'ko'; // Korean
  }
  
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return 'th'; // Thai
  }
  
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar'; // Arabic
  }
  
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi'; // Hindi
  }

  // If no OpenAI API key, use simple heuristics
  if (!OPENAI_API_KEY) {
    // Check for common non-English patterns
    const lowerText = text.toLowerCase();
    
    // Vietnamese patterns
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(text)) {
      return 'vi';
    }
    
    // Portuguese/Spanish patterns (common words)
    if (/\b(quero|agendar|amanhã|obrigado|por favor|reservar)\b/i.test(lowerText)) {
      return 'pt';
    }
    
    if (/\b(quiero|agendar|mañana|gracias|por favor|reservar)\b/i.test(lowerText)) {
      return 'es';
    }
    
    if (/\b(je veux|réserver|demain|merci|s'il vous plaît|réservation)\b/i.test(lowerText)) {
      return 'fr';
    }
    
    if (/\b(хочу|забронировать|завтра|спасибо|пожалуйста|бронирование)\b/i.test(lowerText)) {
      return 'ru';
    }
    
    // Default to English
    return 'en';
  }

  // Use OpenAI for accurate detection
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a language detection expert. Analyze the following text and return ONLY the ISO 639-1 language code (e.g., 'ja', 'en', 'zh', 'vi', 'pt', 'fr', 'ru', 'es', 'ko', 'th', 'de', 'it', 'ar', 'hi'). Do not include any explanation, just the two-letter code.`,
          },
          {
            role: 'user',
            content: text.substring(0, 500), // Limit to first 500 chars for efficiency
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI language detection failed:', response.status);
      return 'en'; // Fallback to English
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const detectedCode = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    
    // Validate the code is in our supported list
    if (detectedCode && LANGUAGE_NAMES[detectedCode]) {
      return detectedCode;
    }
    
    return 'en'; // Fallback to English
  } catch (error: any) {
    console.error('Error detecting language:', error);
    return 'en'; // Fallback to English
  }
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || 'Unknown';
}

/**
 * Get language flag emoji from code
 */
export function getLanguageFlag(code: string): string {
  return LANGUAGE_FLAGS[code] || '🌐';
}

