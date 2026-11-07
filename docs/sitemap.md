# Sitemap

Every route in Samiati, what it is for, and who it is for.

---

## 1. Public routes

| Route | Purpose | Auth |
| --- | --- | --- |
| `/` | Welcome screen. Greets the user in their language, offers a composer and starter prompts, and links to Discover and Changa. | None required |
| `/onboarding` | First-run flow: welcome, choose your language, choose whether to contribute. | None required |
| `/chat/[id]` | The conversation. Streamed replies, message actions, per-conversation language. | None required in local mode |

## 2. Product routes (inside the sidebar shell)

| Route | Purpose | Contains |
| --- | --- | --- |
| `/discover` | African news, culture, history, education and community topics. Filter by topic and language. Open any item in a conversation. | Topic chips, language filter, save toggle, "Discuss" action |
| `/changa` | The language contribution platform. Task queue, submission, review, contribution history. | Dashboard stats, task filters, task dialog, contribution list |
| `/communities` | Language-scoped communities. Join, leave, see topics. | Community cards, join/leave |
| `/profile` | The member's public face: languages, contribution statistics, activity heat map, recognition, communities. | Stat cards, heat map, recognition list |
| `/settings` | Language, appearance, accessibility, voice, privacy, account, data consent, translation transparency. | Sectioned settings |

## 3. API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/chat` | `POST` | Runs the translation → reasoning → translation pipeline and streams the result as newline-delimited JSON. |

## 4. Navigation model

```
Sidebar
├── New chat                 → creates a conversation → /chat/[id]
├── Search conversations     → filters the history list in place
├── Language selector        → changes the default language for new chats
├── Discover                 → /discover
├── Changa                   → /changa
├── Communities              → /communities
├── Recent chats             → /chat/[id]
├── Profile                  → /profile
└── Settings                 → /settings

Chat header (mobile + desktop)
├── Back                     → /
├── Conversation title        → rename inline
├── Language selector        → changes THIS conversation's language
└── Actions menu             → rename, delete
```

## 5. Navigation principles

- **One sidebar, two presentations.** Desktop shows it; mobile shows the same
  component in a drawer. Navigation can never drift between the two.
- **Every navigation item leads somewhere that exists.** There are no
  placeholder routes and no dead buttons. Where a feature is not shipped, the
  UI says so in place (for example the disabled voice toggle) rather than
  linking to an empty page.
- **The user never loses their place.** The conversation list reloads on every
  route change, so returning to a chat shows the current title and order.
- **Context is preserved across navigation.** The active language, the
  selected theme and the store are all held above the router, so switching
  between Discover and a chat keeps the language.

## 6. Responsive navigation

| Size | Navigation |
| --- | --- |
| Desktop (≥ 1024px) | Persistent 280px sidebar, always visible. The chat header shows the title, language selector and actions. |
| Tablet (640–1024px) | Single column; the sidebar is still available via the drawer. |
| Mobile (< 640px) | A compact header with a menu button, the wordmark and a compact language selector. The sidebar opens as a drawer. The chat header shows a back arrow instead of the title. |

## 7. Planned routes

These are specified but not built. They are listed so the information
architecture is visible before it is coded.

| Route | Purpose | Phase |
| --- | --- | --- |
| `/changa/tasks/[id]` | A full task page, for long or multi-part tasks | 4 |
| `/changa/review` | The review queue for trusted contributors | 4 |
| `/communities/[id]` | A community with its discussion threads | 5 |
| `/discover/[id]` | A full article | 5 |
| `/settings/keys` | Bring-your-own-key for a self-hosted reasoning endpoint | 5 |
