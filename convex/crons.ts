import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Mark users as offline if inactive for 5+ minutes (every 2 minutes)
crons.interval(
    "cleanup-stale-presence",
    { minutes: 2 },
    internal.presence.cron.cleanupStalePresence
);

// Archive expired challenges (every hour)
crons.interval(
    "archive-expired-challenges",
    { minutes: 60 },
    internal.challenges.cron.archiveExpiredChallenges
);

// Changa processing worker
crons.interval(
    "changa-processing-worker",
    { minutes: 5 },
    internal.changa.worker.processQueuedRuns,
    {}
);

// Daily subscription renewal processor (runs at 6:00 AM UTC)
crons.daily(
    "process-subscription-renewals",
    { hourUTC: 6, minuteUTC: 0 },
    internal.payments.billing.processRenewals,
    {}
);

// ── Discover Cron Jobs ────────────────────────────────────────────────────────

// Fetch RSS/GDELT and process raw items (every 15 minutes)
crons.interval(
    "discover-fetch-and-process",
    { minutes: 15 },
    internal.discover.cron.fetchAndProcess,
    {}
);

// Cluster items and enrich with AI summaries (every 30 minutes)
crons.interval(
    "discover-cluster-and-enrich",
    { minutes: 30 },
    internal.discover.cron.clusterAndEnrich,
    {}
);

// Compute trend scores (every hour)
crons.interval(
    "discover-compute-trend-scores",
    { minutes: 60 },
    internal.discover.cron.computeTrendScores,
    {}
);

// Daily cleanup of old content (runs at 3:00 AM UTC)
crons.daily(
    "discover-cleanup",
    { hourUTC: 3, minuteUTC: 0 },
    internal.discover.cron.cleanup,
    {}
);

export default crons;
