# Running Gemma 4B Locally with Ollama + Integration Plan

## What You're Building

This plan connects your locally-running Gemma 4B (via Ollama) to the Samiati web app.

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Samiati Web App                                │
│                        (Next.js + Convex Backend)                          │
│                              src/app/*                                      │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │
                    Convex Server Action (cloud)
                                 │
                    (cannot access localhost!)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        SOLUTION: Tunnel/Proxy                               │
│                    You need to expose local Ollama                         │
│                    to the internet for Convex to access                     │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │
                    Public URL (ngrok/cloudflared)
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        Your Local Computer                                 │
│  ┌─────────────────┐    ┌─────────────────────────┐                       │
│  │  Ollama         │    │  Tunnel (ngrok)          │                       │
│  │  gemma4b       │───▶│  exposes localhost:11434 │                       │
│  │  running       │    │  to public URL          │                       │
│  └─────────────────┘    └─────────────────────────┘                       │
└────────────────────────────────────────────────────────────────────────────┘
```

## Alternative Architecture (Simpler)

If you just want to test locally without deploying:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Local Development Only                             │
│  ┌─────────────────┐    ┌─────────────────────────┐                       │
│  │  Next.js Dev    │───▶│  Ollama                 │                       │
│  │  Server        │    │  localhost:11434        │                       │
│  └─────────────────┘    └─────────────────────────┘                       │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Install and Run Ollama

### Windows
1. Download from: https://ollama.com/download/windows
2. Run the installer
3. Open Command Prompt or PowerShell
4. Download Gemma 4B:
```cmd
ollama pull gemma4b
```
5. Start Ollama:
```cmd
ollama serve
```

### macOS / Linux
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Download model
ollama pull gemma4b

# Start server
ollama serve
```

---

## Step 2: Choose How to Connect

### OPTION A: Local Development Only (Easiest)
Use when: You want to test Samiati locally without deploying

Ollama already running on `localhost:11434`
- Only works when testing on same machine
- Can't deploy to production

### OPTION B: Tunnel for Production (Recommended for full web app)
Use when: You want your local AI to power the real Samiati app

1. Install ngrok: https://ngrok.com/download
2. Configure:
```cmd
ngrok config add-authtoken YOUR_NGROK_TOKEN
ngrok http 11434
```
3. Get your public URL (e.g., `https://abc123.ngrok.io`)
4. Use this URL in Samiati configuration

---

## Step 3: Update Samiati to Connect

### For Local Development

Update [`convex/chat.ts`](convex/chat.ts):

```typescript
// ADD at top of file (after imports):
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// UPDATE the fetch call (around line 45):
// OLD:
const response = await fetch("https://router.huggingface.co/google/gemma-4-2b-it/v1/chat/completions", {

// NEW:
const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
```

### UPDATE the request body (line 52):

```typescript
// OLD:
model: "google/gemma-4-2b-it",

// NEW:
model: "gemma4b",  // or "google/gemma:4b" depending on how you pulled it
```

---

## Step 4: Environment Variables

Add to your local environment or Convex dashboard:

```
# For local development
OLLAMA_URL=http://localhost:11434

# For production (when using tunnel)
# Your ngrok URL will be something like:
OLLAMA_URL=https://your-tunnel.ngrok.io
```

---

## Step 5: Testing

### Test Ollama locally
```bash
curl http://localhost:11434/v1/chat/completions \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4b",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

### Test via Samiati
1. Start your local dev server:
```bash
npm run dev
```
2. Open http://localhost:3000
3. Send a chat message
4. Check response from your local Gemma!

---

## Files to Modify

| File | Change |
|------|--------|
| [`convex/chat.ts`](convex/chat.ts) | Update API URL and model name |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "N/A" response | Check Ollama is running: `ollama list` |
| Connection refused | Start Ollama: `ollama serve` |
| Model not found | Download: `ollama pull gemma4b` |
| Slow responses | Use GPU version of Ollama |
| Works locally but not deployed | Set up ngrok tunnel + OLLAMA_URL env var |

---

## Summary of Commands

### On Your Computer (Local)

```cmd
# 1. Install Ollama (from ollama.com)

# 2. Download Gemma
ollama pull gemma4b

# 3. Start Ollama
ollama serve

# 4. (Optional) Set up ngrok for production access
ngrok http 11434
```

### In Samiati Code

Add this to [`convex/chat.ts`](convex/chat.ts):
- Change API endpoint from HuggingFace to your Ollama URL
- Change model name to "gemma4b"

---

## Next Steps

After you install Ollama and get it running:
1. Tell me your public URL (if using ngrok)
2. I'll update the Samiati code to connect to your local Gemma
3. Test the integration

Do you want me to update the Samiati code now to use local Ollama?