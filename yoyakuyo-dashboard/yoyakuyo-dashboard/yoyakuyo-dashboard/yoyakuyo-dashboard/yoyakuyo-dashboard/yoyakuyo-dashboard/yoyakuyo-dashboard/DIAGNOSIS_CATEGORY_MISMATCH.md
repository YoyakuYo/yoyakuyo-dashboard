# 🔍 DIAGNOSIS: Why 2713 Shops Ended Up in "Unknown"

## Problem
After running the migration:
- ✅ Eyelash: 166 shops (working)
- ❌ All other categories: 0 shops
- ❌ Unknown: 2713 shops (most shops!)

## Root Cause Analysis

### Why Patterns Aren't Matching

The migration uses English keywords like:
- `%nail%`, `%hair%`, `%salon%`, `%beauty%`, etc.

But Tokyo shops imported from Google Places API likely have:
1. **Japanese names** (e.g., "ネイルサロン", "ヘアサロン")
2. **Mixed Japanese/English** (e.g., "Tokyo Nail Salon", "Shibuya ヘアサロン")
3. **Romanized Japanese** (e.g., "Neru Saru", "Hairu Saru")
4. **English names** (but might not match our patterns exactly)

### The Issue

The migration includes some Japanese keywords:
- `%ネイル%` (nail)
- `%ヘア%` (hair)
- `%サロン%` (salon)

But:
1. **Pattern matching might be case-sensitive or encoding issues**
2. **Shop names might have different formats** (spaces, punctuation, etc.)
3. **Some shops might be in English but with different spelling**
4. **The patterns might not cover all variations**

### Why Eyelash Works

Eyelash works because:
- It has very specific, unique keywords: "eyelash", "lash", "extension"
- These keywords are less common and more distinctive
- Even in Japanese, eyelash-related terms are specific

### Why Others Don't Work

Other categories fail because:
- "Hair Salon" pattern `%hair%` might not match Japanese shop names
- "Nail Salon" pattern `%nail%` might not match "ネイル" properly
- "Beauty Salon" might not match Japanese beauty terms
- The patterns are too English-centric

## Solution Needed

We need to:
1. **Check actual shop names** in the database to see what they look like
2. **Create patterns that match real shop names** (not just theoretical patterns)
3. **Use more flexible matching** (handle variations, spaces, punctuation)
4. **Add more Japanese keywords** and variations
5. **Test patterns against actual data**

## Next Steps

1. Query the database to see sample shop names
2. Analyze what patterns would actually match
3. Create a new migration with patterns based on real data
4. Make patterns more flexible and comprehensive

