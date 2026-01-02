# Gemini Integration Guide for Your Booking App

## Available Models

You have access to:
- **Gemini 1.5 Flash** - Fast, cost-effective (best for most use cases)
- **Gemini 1.5 Pro** - More capable, slightly more expensive (for complex tasks)

## Cost Comparison

| Model | Input Cost | Output Cost | Best For |
|-------|-----------|-------------|----------|
| **Gemini 1.5 Flash** | $0.075/1M tokens | $0.30/1M tokens | ✅ **Customer AI, Simple queries** |
| **Gemini 1.5 Pro** | $1.25/1M tokens | $5.00/1M tokens | Complex reasoning, Owner AI |

**Cost per conversation (avg 600 input + 300 output tokens):**
- Flash: ~$0.0001 (0.01 cents)
- Pro: ~$0.0015 (0.15 cents)

**Monthly estimates:**
- 10,000 conversations: Flash = $1, Pro = $15
- 100,000 conversations: Flash = $10, Pro = $150

## Recommendation

**Use Gemini 1.5 Flash for:**
- ✅ Customer AI (most traffic)
- ✅ Simple shop searches
- ✅ Basic booking questions
- ✅ General inquiries

**Use Gemini 1.5 Pro for:**
- ✅ Owner AI (if needed for complex analysis)
- ✅ Multi-step booking flows
- ✅ Complex reasoning tasks
- ✅ Advanced analytics queries

**Default: Use Flash for everything** - it's 15x cheaper and handles most tasks well!

---

## Integration Steps

### Step 1: Install Google Generative AI SDK

```bash
cd yoyakuyo-api
npm install @google/generative-ai
```

### Step 2: Get API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

### Step 3: Add Environment Variable

Add to your `.env` file:
```env
GOOGLE_AI_API_KEY=your_api_key_here
```

### Step 4: Update AI Route

Replace OpenAI calls with Gemini in `yoyakuyo-api/src/routes/ai.ts`

---

## Code Implementation

### Option A: Use Flash for Everything (Recommended)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// In your chat endpoint, replace OpenAI call:
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
});

const result = await model.generateContent({
  contents: messages.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  })),
  tools: functions ? [{
    functionDeclarations: functions.map(fn => ({
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    })),
  }] : undefined,
});

const response = await result.response;
const text = response.text();
```

### Option B: Hybrid Approach (Flash for Customer, Pro for Owner)

```typescript
const modelName = role === "owner" ? "gemini-1.5-pro" : "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: modelName });
```

---

## Function Calling with Gemini

Gemini supports function calling! Here's how to adapt your functions:

```typescript
// Your existing functions array needs to be converted to Gemini format
const geminiTools = functions ? [{
  functionDeclarations: functions.map(fn => ({
    name: fn.name,
    description: fn.description,
    parameters: {
      type: "OBJECT",
      properties: fn.parameters.properties,
      required: fn.parameters.required || [],
    },
  })),
}] : undefined;

const result = await model.generateContent({
  contents: messages,
  tools: geminiTools,
});
```

---

## Complete Integration Example

Here's a complete replacement for your OpenAI call:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize (do this once at top of file)
const genAI = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

// In your chat handler:
if (!genAI) {
  return res.status(500).json({
    error: "AI service is not available. Please try again later.",
  });
}

// Choose model based on role
const modelName = role === "owner" ? "gemini-1.5-pro" : "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ 
  model: modelName,
  temperature: role === "customer" ? 0.8 : 0.7,
});

// Convert messages to Gemini format
const geminiMessages = openaiMessages.map(msg => ({
  role: msg.role === "user" ? "user" : "model",
  parts: [{ text: msg.content || "" }],
}));

// Convert functions to Gemini format
const geminiTools = functions ? [{
  functionDeclarations: functions.map(fn => ({
    name: fn.name,
    description: fn.description,
    parameters: {
      type: "OBJECT",
      properties: fn.parameters.properties,
      required: fn.parameters.required || [],
    },
  })),
}] : undefined;

try {
  const result = await model.generateContent({
    contents: geminiMessages,
    tools: geminiTools,
  });

  const response = await result.response;
  
  // Check for function calls
  const functionCalls = response.functionCalls();
  if (functionCalls && functionCalls.length > 0) {
    // Handle function calls (same as OpenAI)
    const functionCall = functionCalls[0];
    // ... your existing function call handling code
  } else {
    // Return text response
    const text = response.text();
    return res.json({
      role: "assistant",
      content: text,
    });
  }
} catch (error: any) {
  console.error("Gemini API error:", error);
  return res.status(500).json({
    error: "Sorry, I encountered an error. Please try again.",
  });
}
```

---

## Cost Optimization Tips

1. **Use Flash by default** - Only use Pro when absolutely necessary
2. **Cache common responses** - Shop info, FAQs, etc.
3. **Limit conversation history** - Only include last 5-10 messages
4. **Use shorter system prompts** - Reduce token count
5. **Batch similar requests** - If possible

---

## Testing

After integration:

1. Test customer AI with simple queries
2. Test shop search functionality
3. Test booking creation flow
4. Monitor API costs in Google Cloud Console
5. Compare response quality vs OpenAI

---

## Migration Checklist

- [ ] Install `@google/generative-ai` package
- [ ] Add `GOOGLE_AI_API_KEY` to environment variables
- [ ] Update `ai.ts` to use Gemini API
- [ ] Convert message format to Gemini format
- [ ] Convert function calling to Gemini format
- [ ] Test with customer queries
- [ ] Test with owner queries
- [ ] Monitor costs and performance
- [ ] Update error handling

---

## Fallback Strategy

Keep OpenAI as fallback:

```typescript
try {
  // Try Gemini first
  const result = await geminiModel.generateContent(...);
} catch (error) {
  // Fallback to OpenAI if Gemini fails
  const openaiResult = await openaiModel.chat.completions.create(...);
}
```

---

## Expected Savings

**Current setup (GPT-4o-mini):**
- 100,000 conversations/month = ~$30

**With Gemini 1.5 Flash:**
- 100,000 conversations/month = ~$10
- **Savings: $20/month (67% reduction)**

**With hybrid (Flash + Pro):**
- 80,000 Flash + 20,000 Pro = ~$13
- **Savings: $17/month (57% reduction)**

---

## Next Steps

1. Install the package: `npm install @google/generative-ai`
2. Get API key from Google
3. I can help you update the `ai.ts` file to use Gemini
4. Test and monitor costs

Would you like me to help implement the Gemini integration in your codebase?

