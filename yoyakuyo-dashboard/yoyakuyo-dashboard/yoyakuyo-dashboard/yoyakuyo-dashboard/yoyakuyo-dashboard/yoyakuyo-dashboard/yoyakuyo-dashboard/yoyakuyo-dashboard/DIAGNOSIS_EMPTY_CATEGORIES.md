# 🔍 DIAGNOSIS: Why Other Categories Are Empty

## Problem
- ✅ 2800+ shops available
- ✅ 166 shops in "Eyelash" category
- ❌ All other categories show 0 shops

## Root Cause: Category Assignment Logic Issue

### The Problem in `add_categories_system.sql`

The migration runs UPDATE statements in this order:

1. **Nail Salon** - matches: `%nail%`, `%manicure%`, `%pedicure%`
2. **Barbershop** - matches: `%barber%`, `%barbershop%`, `%men's hair%`
3. **Hair Salon** - matches: `%hair%`, `%salon%`, `%haircut%`, `%hair color%` ⚠️ **TOO BROAD!**
4. **Spa & Massage** - matches: `%spa%`, `%massage%`, `%therapy%`
5. **Eyelash** - matches: `%eyelash%`, `%lash%`, `%extension%` ✅ **WORKS!**
6. **Beauty Salon** - matches: `%beauty%`, `%cosmetic%`, `%makeup%`
7. **General Salon** - matches: `%salon%`, `%beauty%` ⚠️ **TOO BROAD!**
8. **Unknown** - everything else

### Why It Fails

**"Hair Salon" is checked FIRST and matches `'%salon%'`** - This is extremely broad!

- Almost every shop name contains "salon" (e.g., "Tokyo Beauty Salon", "Shibuya Hair Salon", "Nail Salon Tokyo")
- Since "Hair Salon" is checked BEFORE "General Salon" and "Beauty Salon", it catches almost everything
- Once a shop has `category_id` set, later UPDATE statements skip it (`WHERE category_id IS NULL`)
- Result: Most shops end up in "Hair Salon" or "Unknown", other categories get nothing

**"Eyelash" works** because:
- It has specific, unique keywords: "eyelash", "lash", "extension"
- These don't overlap with other categories
- So 166 shops with these keywords got correctly assigned

### Evidence

Looking at the migration order:
```sql
-- Step 3: Hair Salon (matches %hair% OR %salon% - TOO BROAD!)
UPDATE shops SET category_id = ... WHERE category_id IS NULL AND (LOWER(name) LIKE '%hair%' OR LOWER(name) LIKE '%salon%' ...);

-- Step 7: General Salon (matches %salon% OR %beauty% - TOO BROAD!)
UPDATE shops SET category_id = ... WHERE category_id IS NULL AND (LOWER(name) LIKE '%salon%' OR LOWER(name) LIKE '%beauty%');
```

Since "Hair Salon" runs first and matches `%salon%`, it captures most shops before "General Salon" or "Beauty Salon" can match them.

## Solution

We need to:
1. **Make patterns more specific** - Avoid overly broad matches like `%salon%`
2. **Reorder categories** - Check specific categories first, general ones last
3. **Fix existing assignments** - Re-run category assignment with better logic

### Better Category Assignment Logic

1. **Specific categories first** (Eyelash, Nail Salon, Barbershop)
2. **Medium specificity** (Spa & Massage, Beauty Salon)
3. **General categories last** (Hair Salon, General Salon)
4. **Unknown** - everything else

### Pattern Improvements

- **Hair Salon**: Should match `%hair%` but NOT `%salon%` alone (too broad)
- **General Salon**: Should be a catch-all for shops with "salon" that don't match other categories
- **Beauty Salon**: Should match `%beauty%` but be checked before "General Salon"

## Next Steps

1. Create a new migration to fix category assignments
2. Use more specific patterns
3. Re-order category checks (specific → general)
4. Re-assign all shops with better logic

