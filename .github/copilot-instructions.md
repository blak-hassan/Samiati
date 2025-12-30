# Samiati Copilot Instructions

## Project Overview
Samiati is a Next.js social platform for preserving African languages and digital storytelling. It combines cultural education with community features, using AI for translation and cultural guidance.

## Architecture
- **Frontend**: Next.js 16 + React 19 with TypeScript
- **Backend**: Convex (serverless database + functions)
- **Auth**: Clerk for user management
- **UI**: shadcn/ui components + Tailwind CSS + dark mode
- **AI Services**: Google Gemini for cultural chat, Hugging Face NLLB for translation

## Key Data Models
- `users`: Profiles with cultural background, languages, XP/gamification
- `posts`: Social content (standard, proverbs, questions, fireplace live audio)
- `communities`: Group discussions with moderation
- `conversations/messages`: AI chat with translation
- `contributions`: User-submitted words/stories
- `challenges`: Community challenges with entries
- `reports/moderation`: Content moderation system

## Development Workflow
```bash
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex backend locally
npx convex deploy    # Deploy backend changes
npm run build        # Production build
```

## Coding Patterns

### Authentication & User Context
```typescript
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Get current user in Convex functions
const user = await getCurrentUser(ctx); // from users/utils.ts
```

### Data Fetching
```typescript
// Queries
const posts = useQuery(api.posts.queries.getFeed);
const user = useQuery(api.users.queries.getCurrentUser);

// Mutations with optimistic updates
const likePost = useMutation(api.posts.mutations.like);
```

### Component Structure
- Use shadcn/ui primitives (Button, Dialog, etc.)
- Follow dark mode conventions with `dark:` classes
- Cultural theming with orange accents (#cf6317)

### AI Integration
```typescript
// Gemini chat service
import { sendMessageToGemini } from "@/services/geminiService";

// Translation via Convex action
const translated = await ctx.runAction(api.translate.translateText, {
  text: "Hello",
  targetLanguage: "swh_Latn" // Swahili
});
```

### State Management
- Convex for server state
- React hooks for local UI state
- Optimistic updates in custom hooks (see `useComments.ts`)

## Environment Variables
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `NEXT_PUBLIC_GEMINI_API_KEY`: Google AI API key
- `HUGGINGFACE_API_KEY`: Translation service key
- Clerk keys (handled automatically)

## Deployment
- Frontend: Vercel
- Backend: Convex cloud
- Mock mode available when CONVEX_URL not set

## Key Files
- `convex/schema.ts`: Database schema
- `src/app/ConvexClientProvider.tsx`: Auth + Convex setup
- `src/services/geminiService.ts`: AI chat integration
- `src/types.ts`: TypeScript interfaces
- `src/components/ui/`: shadcn components</content>
<parameter name="filePath">c:\Users\pc\Downloads\samiati-1.0\.github\copilot-instructions.md