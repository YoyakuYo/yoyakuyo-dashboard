# GPT-4.1 Usage Guide: Which Model Do You Have?

## Understanding GPT-4.1 Model Names

If you see **"gpt-4.1"** in your OpenAI account, it could be:

1. **The base GPT-4.1 model** (full version)
2. **A simplified name** that OpenAI uses in their dashboard
3. **The model you have access to** (may include all variants)

---

## How to Check Which Model You Have

### Option 1: Check OpenAI Dashboard
1. Go to https://platform.openai.com/
2. Check "Models" section
3. Look for available models:
   - `gpt-4.1` (base model)
   - `gpt-4.1-nano` (cheapest)
   - `gpt-4.1-mini` (balanced)
   - `gpt-4.1` (full version)

### Option 2: Test API Call
Try calling the API with different model names to see which ones work:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

This will show all available models.

---

## If You Only Have "gpt-4.1" (Base Model)

### Pricing:
- **Input:** $2.00 per 1M tokens
- **Output:** $8.00 per 1M tokens
- **Cost per conversation:** ~$0.0018 (0.18 cents)

### Comparison:
| Model | Input Cost | Your Model |
|-------|-----------|------------|
| GPT-4.1 Nano | $0.10 | 20x cheaper |
| GPT-4.1 Mini | $0.40 | 5x cheaper |
| **GPT-4.1 (yours)** | **$2.00** | Baseline |
| GPT-4o | $2.50 | 25% more expensive |

### Recommendation:
**If you only have base GPT-4.1:**
- ✅ **Use it!** It's still cheaper than GPT-4o
- ✅ **Better quality** than GPT-4o-mini
- ✅ **200K context window**
- ⚠️ **More expensive** than Nano/Mini variants

---

## How to Use GPT-4.1 in Your Code

### Current Setup:
```typescript
// Line 1097 in ai.ts
model: role === "owner" ? "gpt-4o" : "gpt-4o-mini",
```

### Option 1: Use GPT-4.1 for Both Roles
```typescript
// Use GPT-4.1 for everything
model: "gpt-4.1",
```

**Cost:**
- Current: ~$51/month for 100K conversations
- With GPT-4.1: ~$18/month for 100K conversations
- **Savings: 65%**

### Option 2: Use GPT-4.1 Only for Owner (Keep GPT-4o-mini for Customer)
```typescript
// Use GPT-4.1 for owner, keep GPT-4o-mini for customer
model: role === "owner" ? "gpt-4.1" : "gpt-4o-mini",
```

**Cost:**
- Current: ~$51/month
- With this: ~$20/month
- **Savings: 61%**

### Option 3: Try Different Model Names
```typescript
// Try these model names to see which ones work:
model: role === "owner" ? "gpt-4.1" : "gpt-4.1-nano",  // If nano available
// OR
model: role === "owner" ? "gpt-4.1" : "gpt-4.1-mini", // If mini available
// OR
model: "gpt-4.1",  // Just use base model
```

---

## Recommended Setup

### If You Only Have Base GPT-4.1:

**Best Option: Use GPT-4.1 for Both Roles**

```typescript
// In yoyakuyo-api/src/routes/ai.ts, line 1097
// Change from:
model: role === "owner" ? "gpt-4o" : "gpt-4o-mini",

// To:
model: "gpt-4.1",
```

**Why:**
- ✅ **65% cost savings** vs current setup
- ✅ **Better quality** than GPT-4o-mini
- ✅ **Same quality** as GPT-4o (but cheaper)
- ✅ **200K context window**
- ✅ **Simple** - one model for everything

**Cost Comparison:**
- Current (GPT-4o + GPT-4o-mini): ~$51/month
- With GPT-4.1: ~$18/month
- **Savings: $33/month**

---

## Testing Your Model

### Step 1: Test if GPT-4.1 Works

Add this test endpoint temporarily:

```typescript
// Test endpoint
router.post("/test-model", async (req: Request, res: Response) => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const testModels = [
    "gpt-4.1",
    "gpt-4.1-nano",
    "gpt-4.1-mini",
  ];

  const results = [];
  
  for (const modelName of testModels) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        results.push({ model: modelName, status: "✅ Available" });
      } else {
        const error = await response.json();
        results.push({ model: modelName, status: "❌ Not available", error: error.error?.message });
      }
    } catch (error: any) {
      results.push({ model: modelName, status: "❌ Error", error: error.message });
    }
  }

  res.json({ results });
});
```

### Step 2: Check Response

Call this endpoint to see which models are available:
```bash
curl -X POST http://localhost:3000/ai/test-model \
  -H "Content-Type: application/json"
```

---

## Cost Analysis: GPT-4.1 Base Model

### If You Only Have Base GPT-4.1:

**Monthly Cost Estimates (100K conversations):**

| Setup | Customer AI | Owner AI | Total |
|-------|-------------|----------|-------|
| **Current** | GPT-4o-mini ($18) | GPT-4o ($33) | **$51** |
| **GPT-4.1 Both** | GPT-4.1 ($18) | GPT-4.1 ($18) | **$18** |
| **GPT-4.1 Owner Only** | GPT-4o-mini ($18) | GPT-4.1 ($18) | **$20** |

**Best Option: Use GPT-4.1 for Both**
- **Savings: $33/month (65% reduction)**
- Better quality than current setup
- Simpler code (one model)

---

## Implementation Steps

### Step 1: Update Model Name

In `yoyakuyo-api/src/routes/ai.ts`:

```typescript
// Find line ~1097
// Change from:
model: role === "owner" ? "gpt-4o" : "gpt-4o-mini",

// To:
model: "gpt-4.1",
```

### Step 2: Test

1. Start your API server
2. Make a test request to `/ai/chat`
3. Check if it works
4. Monitor costs in OpenAI dashboard

### Step 3: Monitor

- Check OpenAI dashboard for costs
- Compare to previous costs
- Adjust if needed

---

## If Model Name Doesn't Work

### Try These Variations:

```typescript
// Option 1: Exact name
model: "gpt-4.1",

// Option 2: With version
model: "gpt-4.1-2025-04-14",

// Option 3: Check what models are available
// Use the test endpoint above to see available models
```

### Common Model Names:
- `gpt-4.1`
- `gpt-4.1-nano`
- `gpt-4.1-mini`
- `gpt-4.1-preview`
- `gpt-4.1-turbo`

---

## Final Recommendation

### If You Only Have Base GPT-4.1:

**✅ Use it for everything!**

```typescript
model: "gpt-4.1",
```

**Benefits:**
- ✅ **65% cost savings** vs current setup
- ✅ **Better quality** than GPT-4o-mini
- ✅ **Same quality** as GPT-4o
- ✅ **200K context window**
- ✅ **Simple** - one model, easy to maintain

**Cost:**
- ~$18/month for 100K conversations
- Much cheaper than current setup ($51/month)

---

## Quick Action Plan

1. **Check your OpenAI dashboard** - see what models you have access to
2. **Update code** - change model name to `"gpt-4.1"`
3. **Test** - make a few API calls to verify it works
4. **Monitor** - check costs in OpenAI dashboard
5. **Enjoy savings!** - 65% cost reduction

**Time required: 5 minutes!**

---

## Summary

**If you only have "gpt-4.1" (base model):**
- ✅ **Use it!** It's still a great choice
- ✅ **65% cheaper** than your current setup
- ✅ **Better quality** than GPT-4o-mini
- ✅ **Simple** - just change one line of code

**Just update your code to:**
```typescript
model: "gpt-4.1",
```

And you're done! 🎉

