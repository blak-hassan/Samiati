# Fix 400 Error in Chat Service

## Problem Summary
User is experiencing a 400 (Bad Request) error when trying to use the chat interface. The chat service uses `google/gemma-2b-it` model via HuggingFace Inference API.

## Root Cause Analysis

The 400 error in `convex/chat.ts` can be caused by several issues:

### 1. **API Key Issues**
- HUGGINGFACE_API_KEY not set in Convex Dashboard
- Invalid or expired API key
- API key doesn't have proper permissions

### 2. **Model Access Issues**
- `google/gemma-2b-it` requires accepting model terms on HuggingFace
- Model might not be available on free tier
- Model might be loading (503 error misreported as 400)

### 3. **Request Format Issues**
- Malformed JSON payload
- Invalid message format
- Missing required fields
- Incorrect Content-Type header

### 4. **API Quota Issues**
- Free tier rate limit exceeded
- Monthly quota reached

## Diagnostic Steps

### Step 1: Check API Key Configuration
**Action**: Verify HUGGINGFACE_API_KEY is set in Convex Dashboard
- Go to Convex Dashboard → Settings → Environment Variables
- Check if `HUGGINGFACE_API_KEY` exists
- Verify the key starts with `hf_` (HuggingFace token format)

### Step 2: Test API Key Validity
**Action**: Run the diagnostic service to test all endpoints
```typescript
// In the app, call:
const results = await diagnoseServices();
console.log(results);
```

Expected output should show:
- Configuration: "ok" (API key is set)
- Chat (Qwen): "ok" or "warning" (model loading)

### Step 3: Verify Model Access
**Action**: Check if you have access to `google/gemma-2b-it`
1. Visit: https://huggingface.co/models/google/gemma-2b-it
2. Check if you see "Access restricted" or "Gated model" warnings
3. If gated, accept the terms and conditions
4. Wait a few minutes for access to propagate

### Step 4: Test API Endpoint Directly
**Action**: Use curl or Postman to test the API
```bash
curl -X POST "https://router.huggingface.co/google/gemma-2b-it/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_HUGGINGFACE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemma-2b-it",
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 5
  }'
```

Expected responses:
- **200**: Success - API key and model access are working
- **401**: Unauthorized - Invalid API key
- **403**: Forbidden - Model requires accepting terms or API key lacks permissions
- **429**: Rate limit exceeded
- **503**: Model is loading (wait and retry)

### Step 5: Review Request Payload
**Action**: Add detailed logging to see exact request being sent
```typescript
// In convex/chat.ts, add before fetch:
console.log("Request payload:", JSON.stringify({
  model: "google/gemma-2b-it",
  messages: apiMessages,
  max_tokens: 300,
  temperature: 0.7,
}, null, 2));
```

### Step 6: Check HuggingFace Account Status
**Action**: Verify your HuggingFace account
1. Login to https://huggingface.co
2. Go to Settings → Access Tokens
3. Verify your token is active and has "Read" permissions
4. Check API usage/quota in Settings → Billing

## Potential Fixes

### Fix 1: Update API Key
If API key is invalid or missing:
1. Generate new token at https://huggingface.co/settings/tokens
2. Add to Convex Dashboard environment variables
3. Redeploy Convex functions

### Fix 2: Accept Model Terms
If model requires terms acceptance:
1. Visit https://huggingface.co/models/google/gemma-2b-it
2. Click "Access restricted" or "Gated model"
3. Accept the terms and conditions
4. Wait 5-10 minutes for access to propagate

### Fix 3: Use Alternative Model
If `google/gemma-2b-it` is not available on free tier, switch to a different model:

**Option A: Use Qwen2.5-0.5B (Smaller, faster)**
```typescript
const response = await fetch("https://router.huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "Qwen/Qwen2.5-0.5B-Instruct",
    messages: apiMessages,
    max_tokens: 300,
    temperature: 0.7,
  }),
});
```

**Option B: Use Microsoft Phi-3-mini (Good balance)**
```typescript
const response = await fetch("https://router.huggingface.co/microsoft/Phi-3-mini-4k-instruct/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "microsoft/Phi-3-mini-4k-instruct",
    messages: apiMessages,
    max_tokens: 300,
    temperature: 0.7,
  }),
});
```

**Option C: Use Mistral-7B-Instruct (Larger, more capable)**
```typescript
const response = await fetch("https://router.huggingface.co/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    messages: apiMessages,
    max_tokens: 300,
    temperature: 0.7,
  }),
});
```

### Fix 4: Improve Error Handling
Add more detailed error logging to help diagnose future issues:

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error(`HuggingFace API Error (${response.status}):`, errorText);
  
  // Parse error response if it's JSON
  let errorDetails = errorText;
  try {
    const errorJson = JSON.parse(errorText);
    errorDetails = errorJson.error || errorJson.message || errorText;
  } catch (e) {
    // Not JSON, use raw text
  }
  
  // Handle specific error codes
  if (response.status === 400) {
    return `ERROR: Bad Request (400). This usually means:\n1. Invalid API key format\n2. Model not available or requires accepting terms\n3. Malformed request payload\n\nDetails: ${errorDetails}`;
  }
  
  if (response.status === 401) {
    return "ERROR: Unauthorized (401). Your API key is invalid or expired. Please check your HUGGINGFACE_API_KEY in Convex Dashboard.";
  }
  
  if (response.status === 403) {
    return "ERROR: Forbidden (403). You may need to accept the model terms at https://huggingface.co/models/google/gemma-2b-it";
  }
  
  if (response.status === 429) {
    return "ERROR: Rate limit exceeded (429). Please wait a moment and try again.";
  }
  
  if (response.status === 503) {
    return "ERROR: Model is loading (503). Please wait 10-20 seconds and try again.";
  }
  
  return `ERROR: HuggingFace API returned status ${response.status}. Details: ${errorDetails}`;
}
```

### Fix 5: Add Request Validation
Validate the request payload before sending:

```typescript
// Validate messages array
if (!apiMessages || apiMessages.length === 0) {
  return "ERROR: No messages provided to send to AI.";
}

// Validate each message has required fields
for (const msg of apiMessages) {
  if (!msg.role || !msg.content) {
    return "ERROR: Invalid message format. Each message must have 'role' and 'content' fields.";
  }
  if (!['user', 'assistant', 'system'].includes(msg.role)) {
    return `ERROR: Invalid message role: ${msg.role}. Must be 'user', 'assistant', or 'system'.`;
  }
}

// Validate API key format
if (!apiKey.startsWith('hf_')) {
  return "ERROR: Invalid API key format. HuggingFace tokens should start with 'hf_'.";
}
```

## Implementation Plan

### Phase 1: Diagnostic (5 minutes)
1. Run diagnostic service to check current status
2. Check API key in Convex Dashboard
3. Test API endpoint directly with curl

### Phase 2: Quick Fixes (10 minutes)
1. If API key issue: Update API key
2. If model terms: Accept terms on HuggingFace
3. If rate limit: Wait and retry

### Phase 3: Code Improvements (15 minutes)
1. Add detailed error logging
2. Add request validation
3. Improve error messages for users

### Phase 4: Alternative Model (20 minutes if needed)
1. If `google/gemma-2b-it` is not available, switch to alternative model
2. Update model ID and endpoint URL
3. Test with new model

## Testing Checklist

- [ ] API key is set in Convex Dashboard
- [ ] API key starts with `hf_`
- [ ] Model terms accepted on HuggingFace (if gated)
- [ ] Direct API test returns 200 or 403 (not 400)
- [ ] Chat interface sends messages successfully
- [ ] Error messages are clear and actionable
- [ ] Diagnostic service shows all services as "ok"

## Common 400 Error Messages and Solutions

| Error Message | Solution |
|---------------|----------|
| "Invalid API key" | Update HUGGINGFACE_API_KEY in Convex Dashboard |
| "Model not found" | Check model ID spelling or use alternative model |
| "Access denied" | Accept model terms on HuggingFace website |
| "Invalid request format" | Check JSON payload structure |
| "Rate limit exceeded" | Wait 1 minute and retry |

## Next Steps

1. **Immediate**: Run diagnostic service to identify exact issue
2. **Short-term**: Apply appropriate fix based on diagnostic results
3. **Long-term**: Implement improved error handling and validation

## Resources

- HuggingFace Inference API Docs: https://huggingface.co/docs/api-inference/
- HuggingFace Models: https://huggingface.co/models
- HuggingFace Settings: https://huggingface.co/settings
- Convex Dashboard: https://dashboard.convex.dev
