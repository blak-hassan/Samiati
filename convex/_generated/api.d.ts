/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as asr from "../asr.js";
import type * as bookmarks_mutations from "../bookmarks/mutations.js";
import type * as bookmarks_queries from "../bookmarks/queries.js";
import type * as challenges_cron from "../challenges/cron.js";
import type * as changa_campaigns from "../changa/campaigns.js";
import type * as changa_consent from "../changa/consent.js";
import type * as changa_curation from "../changa/curation.js";
import type * as changa_evaluation from "../changa/evaluation.js";
import type * as changa_invites from "../changa/invites.js";
import type * as changa_processing from "../changa/processing.js";
import type * as changa_reputation from "../changa/reputation.js";
import type * as changa_seedSheng from "../changa/seedSheng.js";
import type * as changa_stats from "../changa/stats.js";
import type * as changa_submissions from "../changa/submissions.js";
import type * as changa_tasks from "../changa/tasks.js";
import type * as changa_validation from "../changa/validation.js";
import type * as changa_validators from "../changa/validators.js";
import type * as changa_worker from "../changa/worker.js";
import type * as chat from "../chat.js";
import type * as comments_mutations from "../comments/mutations.js";
import type * as comments_queries from "../comments/queries.js";
import type * as communities_mutations from "../communities/mutations.js";
import type * as communities_queries from "../communities/queries.js";
import type * as contributions_mutations from "../contributions/mutations.js";
import type * as contributions_queries from "../contributions/queries.js";
import type * as crons from "../crons.js";
import type * as discover_cron from "../discover/cron.js";
import type * as discover_enrich from "../discover/enrich.js";
import type * as discover_feed from "../discover/feed.js";
import type * as discover_process from "../discover/process.js";
import type * as discover_reputation from "../discover/reputation.js";
import type * as discover_sources from "../discover/sources.js";
import type * as dms_mutations from "../dms/mutations.js";
import type * as dms_queries from "../dms/queries.js";
import type * as feedback from "../feedback.js";
import type * as files from "../files.js";
import type * as lib_aiQuota from "../lib/aiQuota.js";
import type * as lib_aiSecurity from "../lib/aiSecurity.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_validation from "../lib/validation.js";
import type * as moderation from "../moderation.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as payments_billing from "../payments/billing.js";
import type * as payments_paystack from "../payments/paystack.js";
import type * as payments_usage from "../payments/usage.js";
import type * as posts_mutations from "../posts/mutations.js";
import type * as posts_queries from "../posts/queries.js";
import type * as presence_cron from "../presence/cron.js";
import type * as presence_mutations from "../presence/mutations.js";
import type * as presence_queries from "../presence/queries.js";
import type * as profile_queries from "../profile/queries.js";
import type * as reports from "../reports.js";
import type * as reposts_mutations from "../reposts/mutations.js";
import type * as reposts_queries from "../reposts/queries.js";
import type * as sms from "../sms.js";
import type * as smsRateLimit from "../smsRateLimit.js";
import type * as sunflower from "../sunflower.js";
import type * as translate from "../translate.js";
import type * as tts from "../tts.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_utils from "../users/utils.js";
import type * as wiki from "../wiki.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  asr: typeof asr;
  "bookmarks/mutations": typeof bookmarks_mutations;
  "bookmarks/queries": typeof bookmarks_queries;
  "challenges/cron": typeof challenges_cron;
  "changa/campaigns": typeof changa_campaigns;
  "changa/consent": typeof changa_consent;
  "changa/curation": typeof changa_curation;
  "changa/evaluation": typeof changa_evaluation;
  "changa/invites": typeof changa_invites;
  "changa/processing": typeof changa_processing;
  "changa/reputation": typeof changa_reputation;
  "changa/seedSheng": typeof changa_seedSheng;
  "changa/stats": typeof changa_stats;
  "changa/submissions": typeof changa_submissions;
  "changa/tasks": typeof changa_tasks;
  "changa/validation": typeof changa_validation;
  "changa/validators": typeof changa_validators;
  "changa/worker": typeof changa_worker;
  chat: typeof chat;
  "comments/mutations": typeof comments_mutations;
  "comments/queries": typeof comments_queries;
  "communities/mutations": typeof communities_mutations;
  "communities/queries": typeof communities_queries;
  "contributions/mutations": typeof contributions_mutations;
  "contributions/queries": typeof contributions_queries;
  crons: typeof crons;
  "discover/cron": typeof discover_cron;
  "discover/enrich": typeof discover_enrich;
  "discover/feed": typeof discover_feed;
  "discover/process": typeof discover_process;
  "discover/reputation": typeof discover_reputation;
  "discover/sources": typeof discover_sources;
  "dms/mutations": typeof dms_mutations;
  "dms/queries": typeof dms_queries;
  feedback: typeof feedback;
  files: typeof files;
  "lib/aiQuota": typeof lib_aiQuota;
  "lib/aiSecurity": typeof lib_aiSecurity;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/validation": typeof lib_validation;
  moderation: typeof moderation;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "payments/billing": typeof payments_billing;
  "payments/paystack": typeof payments_paystack;
  "payments/usage": typeof payments_usage;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
  "presence/cron": typeof presence_cron;
  "presence/mutations": typeof presence_mutations;
  "presence/queries": typeof presence_queries;
  "profile/queries": typeof profile_queries;
  reports: typeof reports;
  "reposts/mutations": typeof reposts_mutations;
  "reposts/queries": typeof reposts_queries;
  sms: typeof sms;
  smsRateLimit: typeof smsRateLimit;
  sunflower: typeof sunflower;
  translate: typeof translate;
  tts: typeof tts;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/utils": typeof users_utils;
  wiki: typeof wiki;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
