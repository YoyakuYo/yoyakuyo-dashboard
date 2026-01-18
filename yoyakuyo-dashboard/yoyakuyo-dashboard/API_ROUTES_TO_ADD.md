# API Routes to Add to yoyakuyo-api

## Missing Routes Causing 404 Errors

### 1. GET /shops/owner

**File:** `yoyakuyo-api/src/routes/shops.ts`

**Location:** Add this route BEFORE the `/area-tree` route (around line 103, before any dynamic routes)

**Code:**

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

---

### 2. POST /owner/profiles

**File:** `yoyakuyo-api/src/routes/owner.ts` (create this file if it doesn't exist)

**Or add to existing owner routes file**

**Code:**

```typescript
import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// Helper to extract user ID from headers
function getUserId(req: Request): string | null {
  const userId = req.headers["x-user-id"] as string | undefined;
  return userId || null;
}

// POST /owner/profiles - Create or update owner profile
router.post("/profiles", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { full_name, personal_phone, personal_email, role } = req.body;

    if (!full_name || !personal_phone || !personal_email) {
      return res.status(400).json({ error: "full_name, personal_phone, and personal_email are required" });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("owner_profiles")
      .select("id")
      .eq("owner_user_id", userId)
      .single();

    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from("owner_profiles")
        .update({
          name: full_name,
          phone: personal_phone,
          email: personal_email,
          updated_at: new Date().toISOString(),
        })
        .eq("owner_user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating owner profile:", error);
        return res.status(500).json({ error: "Failed to update owner profile" });
      }

      profile = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("owner_profiles")
        .insert({
          owner_user_id: userId,
          name: full_name,
          phone: personal_phone,
          email: personal_email,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating owner profile:", error);
        return res.status(500).json({ error: "Failed to create owner profile" });
      }

      profile = data;
    }

    res.json(profile);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /owner/profiles - Get owner profile
router.get("/profiles", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data: profile, error } = await supabase
      .from("owner_profiles")
      .select("*")
      .eq("owner_user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Owner profile not found" });
      }
      console.error("Error fetching owner profile:", error);
      return res.status(500).json({ error: "Failed to fetch owner profile" });
    }

    res.json(profile);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

**Then register in `yoyakuyo-api/src/index.ts`:**

```typescript
import ownerRoutes from "./routes/owner";

// ... existing code ...

app.use("/owner", ownerRoutes);
```

---

### 3. POST /shops/:id/verification

**File:** `yoyakuyo-api/src/routes/shops.ts`

**Location:** Add after the `/:id/claim` route

**Code:**

```typescript
// POST /shops/:id/verification - Submit verification request with documents
router.post("/:id/verification", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { owner_profile_id, documents } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify shop exists and user owns it
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, owner_user_id, verification_status")
      .eq("id", id)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (shop.owner_user_id !== userId) {
      return res.status(403).json({ error: "You do not own this shop" });
    }

    // Create or update verification request
    let verificationRequest;
    const { data: existingRequest } = await supabase
      .from("shop_verification_requests")
      .select("id")
      .eq("shop_id", id)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      // Update existing request
      const { data, error } = await supabase
        .from("shop_verification_requests")
        .update({
          owner_profile_id: owner_profile_id || existingRequest.owner_profile_id,
          status: "pending",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRequest.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating verification request:", error);
        return res.status(500).json({ error: "Failed to update verification request" });
      }

      verificationRequest = data;
    } else {
      // Create new request
      const { data, error } = await supabase
        .from("shop_verification_requests")
        .insert({
          shop_id: id,
          owner_profile_id: owner_profile_id,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating verification request:", error);
        return res.status(500).json({ error: "Failed to create verification request" });
      }

      verificationRequest = data;
    }

    // Create document records
    if (documents && Array.isArray(documents) && documents.length > 0) {
      const documentRecords = documents.map((doc: any) => ({
        verification_request_id: verificationRequest.id,
        doc_type: doc.doc_type,
        file_url: doc.file_url,
        file_name: doc.file_name,
        file_size: doc.file_size,
        file_type: doc.file_type,
      }));

      const { error: docError } = await supabase
        .from("shop_verification_documents")
        .insert(documentRecords);

      if (docError) {
        console.error("Error creating documents:", docError);
        // Don't fail the whole request, just log the error
      }
    }

    // Update shop verification status
    await supabase
      .from("shops")
      .update({
        verification_status: "pending",
        is_verified: false,
      })
      .eq("id", id);

    res.json({
      request: verificationRequest,
      message: "Verification request submitted successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

---

### 4. GET /shops/:id/verification

**File:** `yoyakuyo-api/src/routes/shops.ts`

**Code:**

```typescript
// GET /shops/:id/verification - Get verification status and documents
router.get("/:id/verification", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify shop exists and user owns it
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, owner_user_id, verification_status, verification_notes")
      .eq("id", id)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (shop.owner_user_id !== userId) {
      return res.status(403).json({ error: "You do not own this shop" });
    }

    // Get verification request
    const { data: verificationRequest } = await supabase
      .from("shop_verification_requests")
      .select("*")
      .eq("shop_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get documents
    let documents = [];
    if (verificationRequest) {
      const { data: docs } = await supabase
        .from("shop_verification_documents")
        .select("*")
        .eq("verification_request_id", verificationRequest.id)
        .order("uploaded_at", { ascending: false });

      documents = docs || [];
    }

    res.json({
      request: verificationRequest,
      documents: documents,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

---

### 5. POST /shops/:id/verification/resubmit

**File:** `yoyakuyo-api/src/routes/shops.ts`

**Code:**

```typescript
// POST /shops/:id/verification/resubmit - Resubmit verification after rejection
router.post("/:id/verification/resubmit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify shop exists and user owns it
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, owner_user_id, verification_status")
      .eq("id", id)
      .single();

    if (shopError || !shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (shop.owner_user_id !== userId) {
      return res.status(403).json({ error: "You do not own this shop" });
    }

    // Create new verification request
    const { data: ownerProfile } = await supabase
      .from("owner_profiles")
      .select("id")
      .eq("owner_user_id", userId)
      .single();

    const { data: verificationRequest, error: verError } = await supabase
      .from("shop_verification_requests")
      .insert({
        shop_id: id,
        owner_profile_id: ownerProfile?.id || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (verError) {
      console.error("Error creating verification request:", verError);
      return res.status(500).json({ error: "Failed to resubmit verification" });
    }

    // Update shop verification status
    await supabase
      .from("shops")
      .update({
        verification_status: "pending",
        is_verified: false,
        verification_notes: null,
      })
      .eq("id", id);

    res.json({
      request: verificationRequest,
      message: "Verification resubmitted successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

---

## How to Add These Routes

1. **For `/shops/owner`**: Add to `yoyakuyo-api/src/routes/shops.ts` BEFORE the `/area-tree` route
2. **For `/owner/profiles`**: Create `yoyakuyo-api/src/routes/owner.ts` and register it in `index.ts`
3. **For verification routes**: Add to `yoyakuyo-api/src/routes/shops.ts` after the `/:id/claim` route

## After Adding Routes

1. Restart the API server (if running locally)
2. Or wait for Render to redeploy (if using Render)
3. Test the shop creation flow again

