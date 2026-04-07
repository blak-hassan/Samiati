# Install Gemma 4B Locally - Manual Setup Guide

## What's Been Done
- ✅ Updated Samiati code (`convex/chat.ts`) to support local Ollama
- ✅ Created setup script (`setup-gemma-local.bat`)
- ✅ Created integration plans

## What You Need To Do

### Step 1: Download Ollama (if not installed)

1. Go to: **https://ollama.com/download/windows**
2. Click **"Download for Windows"**
3. Run the installer

Or use winget:
```cmd
winget install Ollama.Ollama
```

### Step 2: Download Gemma Model

Open Command Prompt and run:
```cmd
ollama pull gemma4b
```

(If gemma4b doesn't work, try: `ollama pull gemma`)

This downloads ~2.5GB - wait for completion.

### Step 3: Start Ollama

```cmd
ollama serve
```

Keep this terminal open! Ollama runs on `http://localhost:11434`

### Step 4: Connect to Samiati

**For Local Development:**
Edit your `.env.local` file in the Samiati project:
```
OLLAMA_URL=http://localhost:11434
```

**For Production (accessible online):**

1. Download ngrok from: https://ngrok.com/download
2. Run:
```cmd
ngrok config add-authtoken YOUR_TOKEN
ngrok http 11434
```
3. Copy the URL (like `https://abc123.ngrok.io`)
4. Add to Convex Dashboard as `OLLAMA_URL`

---

## Files Created

| File | Purpose |
|------|---------|
| `setup-gemma-local.bat` | Automated setup script |
| `convex/chat.ts` | Updated to use local Ollama |
| `plans/gemma-local-ollama-integration-plan.md` | Full guide |

---

## Quick Test

```cmd
curl http://localhost:11434/v1/chat/completions ^
  -X POST ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"gemma4b\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}],\"stream\":false}"
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "ollama not recognized" | Add to PATH or restart terminal |
| "model not found" | Run `ollama pull gemma4b` |
| "connection refused" | Make sure `ollama serve` is running |