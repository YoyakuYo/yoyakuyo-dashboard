# 🔧 Fix Plan: Show All Shops (2800+) in Categories

## Goal
Make all 2800+ shops available in their respective categories, not just the first 1000.

## Approach: Backend Batch Fetching

### Strategy
Instead of fetching all shops in one query (limited to 1000), I'll:
1. **Fetch shops in batches of 1000** using Supabase's `.range()` method
2. **Combine all batches** into a single array
3. **Return all shops** in one response
4. **Maintain all existing functionality** (search, category filter, ordering)

### Implementation Plan

#### Step 1: Create a Helper Function
Create a function `fetchAllShops()` that:
- Fetches shops in batches: `.range(0, 999)`, `.range(1000, 1999)`, `.range(2000, 2999)`, etc.
- Continues until a batch returns less than 1000 rows (indicating we've reached the end)
- Combines all batches into one array
- Applies filters (search, category_id) to each batch
- Maintains ordering

#### Step 2: Modify GET /shops Route
Update the route to:
- Use the new `fetchAllShops()` helper instead of a single query
- Handle category join gracefully (fetch categories separately if join fails)
- Return all shops, not just first 1000

#### Step 3: Preserve Existing Behavior
- Keep search filter working
- Keep category filter working
- Keep ordering (by name)
- Keep category join (with fallback)
- Keep error handling

### Code Structure

```typescript
// Helper function to fetch all shops in batches
async function fetchAllShops(
  dbClient: SupabaseClient,
  search?: string,
  category_id?: string
): Promise<any[]> {
  const allShops: any[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Build query for this batch
    let query = dbClient
      .from("shops")
      .select("*, categories(id, name, description)")
      .order("name", { ascending: true })
      .range(offset, offset + batchSize - 1);

    // Apply filters
    if (search?.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }
    if (category_id?.trim() && category_id !== 'all' && category_id !== 'null') {
      query = query.eq("category_id", category_id);
    }

    const { data, error } = await query;

    if (error) {
      // If join fails, try without join
      // ... fallback logic ...
    }

    if (data && data.length > 0) {
      allShops.push(...data);
      // If we got less than batchSize, we've reached the end
      hasMore = data.length === batchSize;
      offset += batchSize;
    } else {
      hasMore = false;
    }
  }

  return allShops;
}
```

### Benefits
✅ **No frontend changes needed** - API returns all shops in one response  
✅ **Transparent** - Frontend code doesn't need to know about batching  
✅ **Maintains filters** - Search and category filters still work  
✅ **Scalable** - Works with any number of shops  
✅ **Efficient** - Only fetches what's needed (respects filters)

### Edge Cases Handled
- If categories join fails → fallback to query without join
- If a batch fails → log error and continue with next batch
- If no shops found → return empty array
- If filters applied → only fetch matching shops (more efficient)

### Performance Considerations
- **With filters**: Only fetches matching shops (e.g., 166 shops for a category)
- **Without filters**: Fetches all shops in batches (2800+ shops = 3 batches)
- **Category join**: Tries join first, falls back if it fails
- **Memory**: All shops loaded in memory (acceptable for 2800+ records)

### Alternative Considered (Rejected)
- **Frontend pagination**: Would require UI changes, more complex
- **Increase max_rows setting**: Not scalable, security risk
- **Lazy loading**: More complex, requires frontend changes

## Files to Modify
1. `apps/api/src/routes/shops.ts` - Add helper function and update GET route

## Testing
After implementation:
- ✅ All 2800+ shops should be available
- ✅ Category filters should show correct counts
- ✅ Search should work across all shops
- ✅ No frontend changes needed

