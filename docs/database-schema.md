# Database Schema

The domain model, the Convex tables, and the rules that govern them.

---

## 1. Two shapes, one contract

Samiati's data lives in one of two places, and the application sees the same
records either way:

| Backend | Where | When |
| --- | --- | --- |
| `LocalStore` | `localStorage`, one key (`samiati:v1:state`) | Default — no `NEXT_PUBLIC_CONVEX_URL` set |
| `ConvexStore` | Convex cloud | `NEXT_PUBLIC_CONVEX_URL` is set |

The authoritative shape is `lib/data/types.ts`. The Convex schema in
`convex/schema.ts` mirrors it field for field, so a record read from either
backend is identical to the UI.

---

## 2. The domain model

### 2.1 `SamiatiUser`

```ts
interface SamiatiUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
  defaultLanguageId: string;        // language for new conversations
  preferredLanguageIds: string[];   // quick-switch list
  favoriteLanguageIds: string[];    // pinned in the selector
  recentLanguageIds: string[];      // most recent first, max 5
  contributionConsent: boolean;     // may contributions train models?
  plan: "free" | "supporter";
}
```

`defaultLanguageId` and the three preference lists reference **language ids
from the registry**, never free text. A language id that is not in the
registry is treated as unknown and falls back to the default.

### 2.2 `Conversation`

```ts
interface Conversation {
  id: string;
  ownerId: string;
  title: string;
  languageId: string;   // the language this conversation is conducted in
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  archived: boolean;
  branchedFromId?: string;   // set when branched off another conversation
}
```

A conversation carries its own language. Changing the language in the
conversation header changes it for that conversation only; the user's
*default* language is separate and lives on the user.

### 2.3 `Message`

```ts
interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  languageId: string;          // the language this message is written in
  status: "pending" | "streaming" | "complete" | "error";
  createdAt: number;
  updatedAt: number;
  error?: string;
  feedback?: "up" | "down" | null;
  meta?: MessageMeta;          // pipeline provenance — see ai-pipeline.md
}
```

`MessageMeta` is what makes "translation transparency" possible: it records
which model reasoned, which model translated, and whether a translation step
happened at all.

### 2.4 Changa entities

```ts
type ContributionTaskType =
  | "translate" | "validate" | "correct" | "compare" | "terminology";

type ContributionTaskStatus =
  | "open" | "in_progress" | "submitted" | "validated" | "rejected" | "accepted";

interface ContributionTask {
  id: string;
  type: ContributionTaskType;
  languageId: string;
  sourceText: string;
  targetText?: string;   // present for validate/correct
  context?: string;
  difficulty: "easy" | "medium" | "hard";
  status: ContributionTaskStatus;
  createdAt: number;
  updatedAt: number;
  claimedBy?: string;
  rewardPoints: number;
}

interface Contribution {
  id: string;
  taskId: string;
  contributorId: string;
  submittedText: string;
  languageId: string;
  status: "submitted" | "validated" | "accepted" | "rejected";
  qualityScore?: number;   // 0–1, assigned by the review pipeline
  createdAt: number;
  reviewedAt?: number;
}

interface Review {
  id: string;
  contributionId: string;
  reviewerId: string;
  decision: "approve" | "reject" | "needs_revision";
  feedback?: string;
  createdAt: number;
}
```

### 2.5 `Community` and `DiscoverItem`

```ts
interface Community {
  id: string;
  name: string;
  languageId: string;
  description: string;
  memberIds: string[];
  moderatorIds: string[];
  topics: string[];
  createdAt: number;
}

interface DiscoverItem {
  id: string;
  title: string;
  summary: string;
  topic: "trending" | "news" | "technology" | "culture"
        | "history" | "education" | "community";
  languages: string[];
  source: string;
  publishedAt: number;
  readingMinutes: number;
  saved: boolean;
}
```

---

## 3. The Convex tables

`convex/schema.ts`. Nine tables, each indexed on the path the application
actually queries.

| Table | Indexes | Access path |
| --- | --- | --- |
| `users` | `by_clerk_id`, `by_username` | Resolve the current user |
| `conversations` | `by_owner`, `by_owner_updated` | List and sort a user's chats |
| `messages` | `by_conversation`, `by_conversation_created` | Read a thread in order |
| `contributionTasks` | `by_language`, `by_type`, `by_status` | Filter the Changa task queue |
| `contributions` | `by_contributor`, `by_task`, `by_status` | "My contributions", task detail, review queue |
| `reviews` | `by_contribution`, `by_reviewer` | Review history |
| `communities` | `by_language` | Communities for a language |
| `discoverItems` | `by_topic`, `by_published` | Topic filter, newest first |

### 3.1 Why these indexes

Every index corresponds to a query the application makes. Convex indexes are
not free — each one costs write amplification — so an index is only added
where a real query needs it.

- `conversations.by_owner_updated` supports the sidebar, which sorts by
  `updatedAt` for one owner.
- `messages.by_conversation_created` supports ordered thread reads and
  avoids an in-memory sort of the whole conversation.
- `contributions.by_contributor` powers the profile page's contribution
  list; `by_task` powers the task detail view.

### 3.2 Referential integrity

Convex has no foreign keys. Integrity is maintained by the functions:

- Every query and mutation resolves the current user first
  (`convex/lib/currentUser.ts`).
- Every read of a conversation or message verifies `ownerId` before
  returning anything.
- Deleting a conversation deletes its messages explicitly
  (`convex/conversations.ts` → `remove`).

---

### 3.3 The Phase 4-6 tables

| Table | Purpose |
| --- | --- |
| `qualityReports` | The result of the automated checks for each contribution. `autoAccepted` is always false — automation flags, a person decides. |
| `moderationActions` | The audit log. Every moderation action is written here *before* it is applied. |
| `threads` | A discussion in one language community. |
| `threadPosts` | Replies in a thread. `hidden` keeps a moderated post for the audit trail while removing it from the thread. |
| `datasetVersions` | A frozen, provenance-tracked release of reviewed contributions, with a checksum and a review status. |

The dataset version's review status moves `draft → reviewed → training_ready
→ released`. The backend refuses the move to `training_ready` unless the
version has items, a non-zero mean quality score and provenance. That gate
is the last line of defence between a pile of contributions and a training
run.

### 3.4 Deploying a schema change

A schema change is a deployment, not just a commit. See
[CONTRIBUTING.md](../CONTRIBUTING.md#deploying-a-schema-change) for the
procedure and the two rules that keep it safe: new columns are optional, and
new tables are additive.

The `reviews` table carries one optional field, `decisive`, which records
whether a review decided the contribution on its own. It is optional so that
reviews written before the field existed keep their original meaning.

---
## 4. Access control

| Rule | Enforcement |
| --- | --- |
| A user may only read their own conversations and messages | Owner check in every conversation and message function |
| A user may only submit contributions as themselves | `contributorId` is taken from the resolved user, never from the argument |
| A user may only review with their own identity | `reviewerId` is taken from the resolved user |
| Language ids must exist | Validated by the registry on the client; the schema stores an opaque string so a language can be added without a migration |

Clerk's `public_metadata.role` is available for future moderator roles. Samiati
does not use it yet — moderation is modelled (`moderatorIds`) but not
implemented, and the Changa review flow in the MVP allows any authenticated
user to review. Tightening that to moderator-only is a Phase 4 item.

---

## 5. Migrations

**Rule: migrations are additive.** No destructive operation ships in a
release.

| Change | Migration |
| --- | --- |
| New optional field on a table | Add `v.optional(...)` to the validator. Old documents remain valid. |
| New table | Add it. Nothing reads it until the code does. |
| New required field on a table | Add it as optional first, backfill in a one-off mutation, then make it required in a later release. |
| Renaming a field | Add the new field, dual-write, backfill, switch reads, remove the old field in a later release. |
| Renaming a **language id** | **Never.** Language ids are a public, persisted contract. Changing one requires an explicit data migration that rewrites every conversation, message, task, contribution and community. |

There is no migration runner in the MVP because there is no schema history
yet. When the first non-additive change lands, `convex/migrations/` will be
introduced with numbered, idempotent, forward-only migrations.

---

## 6. Data volume expectations

| Table | Rows per user per month | Note |
| --- | --- | --- |
| `users` | 1 | |
| `conversations` | ~40 | Most users have dozens, not thousands |
| `messages` | ~600 | ~15 messages per conversation |
| `contributionTasks` | 0 (global) | Seeded and curated, not user-generated |
| `contributions` | ~100 for an active contributor | The fastest-growing table |
| `reviews` | ~50 for an active reviewer | |
| `communities` | 0 (global) | |
| `discoverItems` | 0 (global) | Grows with the news pipeline |

At this scale Convex's free tier is more than sufficient. The cost driver is
not storage; it is the reasoning model.

---

## 7. What is deliberately not in the schema yet

| Not modelled | Why | When |
| --- | --- | --- |
| `datasetVersions` | No dataset pipeline exists to version. | Phase 6. |
| `audioRecordings` | No voice contribution task type is live. | Phase 6. |
| `threads` / `threadPosts` | Community discussion is not implemented. | Phase 5. |
| `modelReleases` | No model is trained from Samiati data yet. | Phase 6. |
| `usageLedger` | No subscription or metering in the MVP. | Phase 5. |

The brief says: "Do not implement unnecessary tables before their corresponding
features exist." Samiati follows that. The domain types for dataset versions
and recordings are *described* in `docs/changa-architecture.md`, but there are
no tables for them until there is something to store.

