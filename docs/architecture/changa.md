# Changa Architecture

Changa is the community-driven contribution module within Samiati. It gamifies the crowdsourced collection, validation, and curation of African language data.

## Task Pipeline

1. **Task Templates** (`changaTaskTemplates`): Versioned contracts defining input/output schemas, required audio/translation, risk tiers, and consent scopes.
2. **Task Claiming**: Users claim open tasks with a 20-minute window, max 10 concurrent claims.
3. **Submission**: Contributors submit with client-side idempotency keys.
4. **Validation**: Blind review queue where trusted contributors vote (`accept`, `minor_fix`, `reject`).
5. **Curation**: High-quality submissions promoted to `changaCuratedExamples` with quality scores and dataset split recommendations.

## Validation & Moderation

- **Blind Review**: The bundle hides earlier votes unless the reviewer is a moderator.
- **Quorum**: Submissions require enough votes to reach a verdict.
- **Calibration**: Gold tasks measure reviewer accuracy.

## Reputation & Roles

Granular language-scoped roles: `new_contributor` → `verified_expert`. Trust scores are computed from contribution count, validation count, accept rate, and review agreement rate.

## Consent Model

Explicit consent scopes (`voiceDataAllowed`, `culturalDataAllowed`, `attributionPreference`) tied to policy versions. Contributors must opt in before submission.

## Gamification

- XP awarded on approval (varies by type: Word=5, Phrase=8, etc.)
- Streak bonuses at 3, 7, 14, 30, 100 days
- Validation bonuses at 5, 10, 25 upvotes
- 10 levels from Newcomer to Language Master

## Frontend Structure

```
src/components/changa/
├── ChangaHome.tsx           # Revamped prototype home (greeting, today's goal,
│                            #   community + keeper entry cards, missions, ways to help)
├── ChangaCommunity.tsx      # Community page (goal header, contributions/people/
│                            #   hours-of-speech, word of the day, recognition,
│                            #   language-goal breakdown, region voices, start-a-challenge)
├── ChangaCommunityBits.tsx  # Community building blocks (WordOfTheDayCard,
│                            #   RecognitionBoard, GoalBreakdown, RegionVoicesGrid)
├── ChangaBits.tsx           # Shared home blocks (TodayGoalCard, MissionGrid, …)
├── ChangaCampaigns.tsx      # Campaign listing
├── MyChangaActivity.tsx     # User's submission history
├── ValidationRunner.tsx     # Review queue UI (+ SwipeVoteDeck)
├── SwipeVoteDeck.tsx        # Prototype swipe voting (right = accept, left = fix/reject)
├── XpCelebration.tsx        # Prototype +XP success toast after a contribution
├── TaskContributionScreen.tsx # Task input + submission flow (region picker, 0:00 timer)
├── ProjectHero.tsx          # Campaign/project header
├── SquadList.tsx            # Contributor rankings
├── XPProgressBar.tsx        # Level progress indicator
├── ChangaEmptyState.tsx     # New contributor onboarding
└── inputs/
    ├── DialectMapper.tsx
    ├── TotemUploader.tsx
    └── AccentRecorder.tsx
```

Challenge creation (`src/components/screens/AddChallengeScreen.tsx`) follows the
prototype form — What kind / Give it a name / Which region / Goal / Why does it
matter / Who should we ask to join — and submits a **campaign proposal** for
moderator review ("A moderator checks it before it goes live"), not a live
campaign. Moderator entry points are `ModeratorApplicationScreen.tsx`
("Be a keeper of your language") and `ModerationDashboardScreen.tsx`
(Waiting · Checked today · Agreement · Moderation XP).

## Backend Structure

```
convex/changa/
├── validators.ts    # Zod-like Convex validators
├── tasks.ts         # Task template + listing + claiming
├── submissions.ts   # Submission CRUD + idempotency
├── validation.ts    # Queue, votes, bundles
├── campaigns.ts     # Campaign CRUD + proposals (challenge form submits a proposal)
├── community.ts     # Prototype community surface: getWordOfTheDay,
│                    #   getRecognitionBoard, getLanguageGoal,
│                    #   getRegionsNeedingVoices, getDailyGoal, getCommunitySummary
├── reputation.ts    # Role grants, reviewer calibration
├── stats.ts         # User + language stats
├── invites.ts       # Invite code system
├── curation.ts      # Curated examples
├── worker.ts        # Background processing
├── processing.ts    # ASR, quality checks
├── seedDemo.ts      # Demo seed — also writes changaWordOfTheDay /
│                    #   changaLanguageGoals / changaRegionVoices (Mũgumo, ki goal,
│                    #   Kiambu · Murang'a · Nyeri · Kirinyaga)
└── consent.ts       # Consent policies
```
