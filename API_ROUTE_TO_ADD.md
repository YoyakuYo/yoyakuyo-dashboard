# API Route to Add

## Missing Route: GET /shops/owner

**File:** `yoyakuyo-api/src/routes/shops.ts`

**Location:** Add this route BEFORE the `/area-tree` route (around line 103)

**Code to add:**

```typescript
// GET /shops/owner - Get shops owned by the authenticated user
router.get("/owner", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data: shops, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching owner shops:", error);
      return res.status(500).json({ error: "Failed to fetch shops" });
    }

    res.json({ shops: shops || [] });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

**Important:** This route MUST be added BEFORE routes like `/area-tree` to avoid route conflicts.

