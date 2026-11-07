# Changa — Samiati's Language Contribution Platform

Changa turns the people who speak a language into the people who teach it to
the model.

---

## 1. Why Changa exists

Machine translation for Kiswahili is good. Machine translation for Sheng is
bad, and it will stay bad until someone writes down how Sheng is actually
used. The same is true of every dialect, register and cultural register in
the registry.

No model can learn what is not written down. Changa is the mechanism for
writing it down — and for making sure that what is written down is *right*.

Changa is architected as a **distinct domain** with its own vocabulary, but
it lives in the same application, uses the same language registry, and shares
the same store contract.

---

## 2. The contribution lifecycle

```
   ┌──────────────┐
   │  Discover    │  a contributor finds a task
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Open Task   │  see the source text, the context, the difficulty
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Complete    │  write the translation / assessment
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   Submit     │  status → submitted
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │  Validation  │  automated checks (see §5)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │   Review     │  a second speaker of the language decides
   └──────┬───────┘
          ▼
    ┌───────────┐
    │ Accepted  │──▶ Recognition ──▶ Dataset Eligibility
    │ Rejected  │
    └───────────┘
```

Statuses map directly onto the schema:

| Stage | `Contribution.status` | `ContributionTask.status` |
| --- | --- | --- |
| Submitted | `submitted` | `submitted` |
| Needs revision | `validated` | `validated` |
| Accepted | `accepted` | `accepted` |
| Rejected | `rejected` | `rejected` |

---

## 3. Task types

### 3.1 Implemented in this release

| Type | The contributor is asked to | Example |
| --- | --- | --- |
| `translate` | Write the source text in their language. | "The community water pump has been out of order for three weeks." → a Kikuyu translation |
| `validate` | Say whether an existing translation reads naturally, and explain what they would change. | A Kiswahili translation of an announcement |
| `correct` | Improve a translation that is close but not right. | A Sheng sentence written in book Swahili |
| `compare` | Choose between candidate words, or judge which is used. | "harvest" → "ũvimbi" |
| `terminology` | Collect the term their community actually uses, with a note. | "mobile money" |

Each task carries: `sourceText`, optional `targetText`, optional `context`,
`difficulty`, `languageId` and `rewardPoints`.

### 3.2 Planned, not implemented

| Type | Why it is later |
| --- | --- |
| `asr_recording` | Needs audio storage, consent flows and a recording UI. |
| `tts_recording` | Needs the same, plus quality criteria for speech. |
| `speech_validation` | Depends on the two above. |
| `cultural_knowledge` | Needs a richer submission format than a single text field. |
| `dialect_collection` | Needs a dialect taxonomy that communities agree on. |

The type is a union in `lib/data/types.ts` and a validator in
`convex/schema.ts`. Adding a type means adding it to both, plus a task
generator and a submission UI variant.

---

## 4. What is implemented today

`components/changa/changa-view.tsx` and `convex/changa.ts`.

| Capability | Status |
| --- | --- |
| Contribution dashboard (open tasks, submitted, accepted, impact points) | **Live** |
| Task list, filterable by type and by language | **Live** |
| Task detail dialog with source text, context and existing translation | **Live** |
| Submit a contribution | **Live** — persisted through `SamiatiStore.submitContribution` |
| Contribution status tracking | **Live** |
| Review creation (approve / reject / needs revision) | **Live** — `SamiatiStore.createReview` |
| Quality score assignment | **Live** — a simple 0.9 / 0.5 / 0.1 mapping today |
| Contribution history | **Live** — on the Changa page and the profile page |
| Community membership and language scoping | **Live** |
| Automated quality checks | **Designed** (§5), not implemented |
| Duplicate detection | **Designed** (§5), not implemented |
| Moderator-only review | **Designed**, not implemented |
| Dataset export and versioning | **Designed** (§7), not implemented |

The seed tasks are **sample content** and the UI says so. The submission and
review flow is real and persists.

---

## 5. Contribution quality

The brief is explicit: *"Do not use contribution counts alone as a measure of
dataset quality."* Samiati agrees. A contributor who submits 10,000 identical
rows has contributed less than one who submits 200 accurate ones.

### 5.1 The quality model

A contribution's quality is a **composite**, not a count:

| Signal | Weight | What it measures |
| --- | --- | --- |
| `reviewScore` | 0.4 | The decision of reviewers who speak the language |
| `agreement` | 0.2 | How often independent reviewers agree |
| `consistency` | 0.15 | Agreement with the corpus's established usage of the same term |
| `novelty` | 0.1 | Whether the contribution adds something new rather than repeating |
| `reliability` | 0.15 | The contributor's accepted-to-rejected ratio over time |

`qualityScore` (already on the schema, `0`–`1`) is the composite.

### 5.2 Automated checks

Planned, and deliberately specified before they are built:

| Check | Rule |
| --- | --- |
| **Empty / trivial** | Reject submissions that are empty, whitespace-only, or identical to the source text. |
| **Duplicate detection** | Near-duplicate check against existing contributions for the same task and language, using normalised token similarity. |
| **Copy detection** | Detect submissions identical to an existing accepted contribution (often sign of accidental double submission, or of scraping). |
| **Register check** | Flag a submission whose vocabulary matches the source language closely — often a sign the contributor pasted the English. |
| **Length sanity** | Flag submissions whose length is wildly out of proportion to the source. |
| **Script check** | Verify the submission is in the expected script for the language. |

None of these may **accept** a contribution on their own. They can only flag
one for review. That is the point: an automated check that accepts
contributions would let quantity masquerade as quality.

### 5.3 Reviewer reliability

Reviewers are themselves scored. A reviewer whose approvals are frequently
overturned by a second reviewer loses weight, and eventually loses the ability
to approve alone. New reviewers approve only alongside an established one.

### 5.4 Community moderation

`Community.moderatorIds` is the moderation surface. A moderator can:

- remove a contribution from the queue with a reason;
- suspend a contributor from a language community;
- edit a task's context or difficulty;
- promote a reviewer into the reviewer pool.

Moderation actions are themselves logged (a `moderationActions` table is
planned for Phase 4).

---

## 6. Recognition and impact

Recognition is **earned, not given by volume**:

| Recognition | Requirement |
| --- | --- |
| First contribution | 1 accepted contribution |
| Trusted contributor | 25 accepted contributions with quality ≥ 0.7 |
| Reviewer | 50 reviews with agreement ≥ 0.8 |
| Language steward | 500 accepted contributions plus community moderation record |

The profile page shows contribution statistics, a contribution heat map, the
communities a member belongs to, and the list of accepted contributions.
Recognition is visible; points are secondary.

---

## 7. Dataset preparation

The route from contribution to trained model. **Raw contributions are never
fine-tuned on.** This is the single most important rule in this document.

```
contributions (submitted)
        │
        ▼
  [1] automated checks ──── flagged ──▶ back to the review queue
        │ pass
        ▼
  [2] human review ───────── rejected ──▶ recorded, not exported
        │ accepted
        ▼
  [3] normalisation ──── whitespace, Unicode form, casing
        │
        ▼
  [4] de-duplication ─── near-duplicate clustering
        │
        ▼
  [5] consistency review ─ per-language terminology checks
        │
        ▼
  [6] quality scoring ─── the composite from §5.1
        │
        ▼
  [7] dataset version ─── a frozen, provenance-tracked release
        │
        ▼
  [8] split ───────────── train / validation / test
        │
        ▼
  [9] training readiness review
        │
        ▼
  [10] fine-tune / evaluate / release
```

### 7.1 Planned interfaces

These are **specified now, implemented in Phase 6**, so the contribution
model does not have to be redesigned when the pipeline arrives.

```ts
interface DatasetExporter {
  export(options: {
    languageIds: string[];
    minQualityScore: number;
    acceptedOnly: true;
    format: "jsonl" | "parquet" | "csv";
  }): Promise<DatasetVersion>;
}

interface DatasetCleaner {
  clean(versionId: string): Promise<CleaningReport>;
}

interface QualityScorer {
  score(versionId: string): Promise<QualityReport>;
}

interface TrainingReadinessChecker {
  check(versionId: string): Promise<ReadinessReport>;
}

interface ModelReleaseTracker {
  record(versionId: string, modelId: string, metrics: EvaluationMetrics): Promise<void>;
}
```

### 7.2 `DatasetVersion` (planned)

```ts
interface DatasetVersion {
  id: string;
  version: string;              // "kiswahili-2026.03.1"
  languageIds: string[];
  createdAt: number;
  provenance: {
    contributionIds: string[];  // every source contribution, traceable
    reviewIds: string[];
    cleaningReportId: string;
    qualityReportId: string;
  };
  metrics: {
    itemCount: number;
    meanQualityScore: number;
    contributorCount: number;
    languageCoverage: number;   // distinct terms per 1,000 words
  };
  export: {
    format: string;
    checksum: string;
    storageKey?: string;
  };
  review: {
    status: "draft" | "reviewed" | "training_ready" | "released";
    reviewedBy?: string;
    reviewedAt?: number;
  };
}
```

---

## 8. Fairness and incentives

Contribution is unpaid in the MVP. That is a deliberate choice, and it has
consequences that must be managed:

- **Points are not money.** They are a recognition signal, not a wage.
- **Quality gates the reward.** A low-quality contribution earns nothing, no
  matter how fast it is produced.
- **The consent model is explicit.** `SamiatiUser.contributionConsent` decides
  whether a member's contributions may be used for model training. It can be
  changed at any time in Settings.
- **Languages are not raced.** Reward points are per-language in the dataset
  metrics, so a language with few contributors is not drowned out by
  Kiswahili.

A paid contributor programme is a Phase 5/6 question. It requires real
budget, and it introduces a risk — contributors optimising for volume — that
the quality model above is designed to control.

---

## 9. Why Changa is a separate domain, not a chat feature

Changa has a different vocabulary, a different lifecycle, a different
audience (contributors rather than users), a different moderation model, and
a different downstream consumer (the dataset pipeline rather than the chat
screen). Folding it into the chat would make both worse. It lives in its own
route group, its own component, its own Convex module (`convex/changa.ts`),
and its own documentation — but it shares the language registry, the store
contract and the design system.


