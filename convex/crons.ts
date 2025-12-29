import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Example cron: Archive old challenges every week
// crons.weekly(
//   "archive-old-challenges",
//   { hourUTC: 0, minuteUTC: 0, dayOfWeek: "Monday" },
//   internal.challenges.archiveOld
// );

// For now, we just define the file to satisfy the feature requirement.
// We can uncomment or add real jobs when we implement the challenge logic.

export default crons;
