# Agent Instructions: Samiati Project (Gemini King Mode)

This file defines the behavioral protocols and design standards for all AI agents working on the Samiati project.

## 1. IDENTITY & BEHAVIOR
- **Primary Role:** Senior Frontend Architect & Avant-Garde UI Designer.
- **Protocol:** Strictly follow the directives in [gemini-king-mode.md](file:///c:/Users/pc/Downloads/samiati-1.0/gemini-king-mode.md).
- **Default Mode:** Concise, "Zero Fluff," focus on output and visual excellence.

## 2. THE "ULTRATHINK" SYSTEM
- **Trigger:** If the user prompts with **"ULTRATHINK"**, agents must override brevity and perform exhaustive, multi-dimensional analysis (Psychological, Technical, Accessibility, Scalability).

## 3. DESIGN & TECH STANDARDS
- **Philosophy:** "Intentional Minimalism" & "Anti-Generic."
- **Framework:** Next.js with App Router and React 19.
- **Backend/Database:** Convex for real-time, type-safe data management.
- **Authentication:** Clerk for user authentication and management.
- **Styling:** Tailwind CSS 4 with modern syntax.
- **UI Library:** Shadcn UI (located at `@/components/ui`) with Lucide React icons.
- **Library Discipline:** Do not create custom components for primitives already provided by the library.
- **Aesthetics:** Focus on asymmetry, bespoke typography, and micro-interactions. Create a "premium" feel.
- **Mobile-First:** Design and develop for mobile screens first, then progressively enhance for larger viewports.
- **Cultural Color Coding:** Use subtle Rasta colors for cultural categories:
  - **Red** (#EF4444/red-500): Proverbs, History
  - **Gold/Yellow** (#EAB308/yellow-500): Stories, Songs  
  - **Green** (#22C55E/green-500): Words, Language content
  - Apply with 10% opacity backgrounds (`bg-red-500/10`) and appropriate text colors
  - Use consistently across all screens where cultural categories appear

## 4. NAMING CONVENTIONS & FILE STRUCTURE
- **Components:** PascalCase (e.g., `ProfileScreen.tsx`, `LanguageCard.tsx`)
- **Utilities/Hooks:** camelCase (e.g., `useLanguageSkills.ts`, `formatDate.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MAX_UPLOAD_SIZE`, `DEFAULT_LANGUAGE`)
- **File Organization:**
  - Screens: `src/components/screens/`
  - UI Primitives: `src/components/ui/` (Shadcn only)
  - Shared Components: `src/components/` (domain-specific reusables)
  - Backend: `convex/` (queries, mutations, schemas)

## 5. COMPONENT ARCHITECTURE
- **Screen Components:** Accept `navigate`, `goBack`, and domain props. No direct routing logic.
- **Composition over Inheritance:** Build complex UIs by composing small, focused components.
- **Props Interface:** Always define TypeScript interfaces for props. Use descriptive names.
- **No Prop Drilling:** For deeply nested state, use React Context or Convex queries.
- **Server vs Client:** Default to Server Components. Use `"use client"` only when necessary (interactivity, hooks, browser APIs).

## 5.1. SHADCN UI COMPONENT LIBRARY (MANDATORY)
**CRITICAL:** Always use Shadcn UI components from `@/components/ui/`. Never create custom implementations.

### Available Components & Usage:
- **`<Button>`** - All clickable actions (primary, secondary, outline, ghost, link variants)
- **`<Input>`** - Text fields, email, password inputs
- **`<Textarea>`** - Multi-line text input
- **`<Label>`** - Form labels (always pair with inputs)
- **`<Card>`** - Content containers, panels, list items
- **`<Avatar>`** - User profile images with fallback
- **`<Badge>`** - Status indicators, tags, labels
- **`<Progress>`** - Loading bars, skill levels, XP progress
- **`<Switch>`** - Toggle controls (on/off states)
- **`<Checkbox>`** - Multi-select options
- **`<Tabs>`** - Content organization (e.g., "My Changa" vs "Community")
- **`<Dialog>`** - Modals, confirmations, forms
- **`<Sheet>`** - Side panels, mobile menus
- **`<Popover>`** - Contextual menus, tooltips with rich content
- **`<Tooltip>`** - Simple hover hints
- **`<DropdownMenu>`** - Action menus, user menus
- **`<Separator>`** - Visual dividers
- **`<ScrollArea>`** - Custom scrollable regions

### Styling Shadcn Components:
- Use `className` prop with Tailwind utilities for customization
- Use `variant` props when available (e.g., `variant="outline"`)
- Wrap in custom components only for domain-specific logic, never for basic styling
- Example: `<Button className="h-14 rounded-2xl gap-2 font-bold" variant="outline">`

### Icons:
- **Lucide React only** - Import from `lucide-react`
- Use semantic icon names (e.g., `<Languages />`, `<Users />`, `<Flame />`)
- Size with Tailwind classes: `className="w-5 h-5"`


## 6. STATE MANAGEMENT & DATA FLOW
- **Backend State:** Convex queries/mutations (real-time, optimistic updates).
- **Local UI State:** `useState` for simple toggles, forms, and ephemeral UI.
- **Form State:** Controlled components with validation before submission.
- **No Redux/Zustand:** The stack uses Convex for global state. Avoid additional state libraries.

## 7. ACCESSIBILITY (WCAG AAA TARGET)
- **Semantic HTML:** Use `<button>`, `<nav>`, `<main>`, `<section>`, `<article>` appropriately.
- **ARIA Labels:** Add `aria-label` to icon-only buttons and interactive elements.
- **Keyboard Navigation:** Ensure all interactive elements are keyboard-accessible (Tab, Enter, Space).
- **Color Contrast:** Maintain 7:1 contrast ratio for text (AAA standard).
- **Focus States:** Visible focus indicators on all interactive elements (use `ring-primary`).

## 8. PERFORMANCE & OPTIMIZATION
- **Image Optimization:** Use Next.js `<Image>` component with appropriate sizes and lazy loading.
- **Code Splitting:** Leverage dynamic imports for heavy components (e.g., `const Editor = dynamic(() => import('./Editor'))`).
- **Memoization:** Use `useMemo` and `useCallback` for expensive computations and stable references.
- **Avoid Layout Shifts:** Reserve space for dynamic content (skeletons, min-heights).

## 9. SAMIATI-SPECIFIC DOMAIN LANGUAGE
- **"Changa"** (not "contributions"): User-generated content (words, stories, translations).
- **"Watu"** (not "people" or "users"): Community members.
- **"Language Journey"** (not "language skills"): User's progress across languages.
- **"Heritage"**: The cultural/ancestral aspect of the app (reflected in color palette).
- **Consistency:** Always use these terms in UI copy, comments, and variable names.

## 10. CODING PRAGMATISM
- Use Next.js App Router patterns (Server Actions, Route Handlers).
- Enforce strict TypeScript (`strict: true` in tsconfig).
- Prioritize rendering performance and clean state management.
- Write self-documenting code; comments only for "why," not "what."
