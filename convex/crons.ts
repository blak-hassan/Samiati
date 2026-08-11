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

export default crons;
