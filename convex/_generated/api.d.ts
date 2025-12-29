/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as comments_mutations from "../comments/mutations.js";
import type * as comments_queries from "../comments/queries.js";
import type * as communities_mutations from "../communities/mutations.js";
import type * as communities_queries from "../communities/queries.js";
import type * as contributions_mutations from "../contributions/mutations.js";
import type * as contributions_queries from "../contributions/queries.js";
import type * as crons from "../crons.js";
import type * as dms_mutations from "../dms/mutations.js";
import type * as dms_queries from "../dms/queries.js";
import type * as files from "../files.js";
import type * as moderation from "../moderation.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as posts_mutations from "../posts/mutations.js";
import type * as posts_queries from "../posts/queries.js";
import type * as reports from "../reports.js";
import type * as translate from "../translate.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_utils from "../users/utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "comments/mutations": typeof comments_mutations;
  "comments/queries": typeof comments_queries;
  "communities/mutations": typeof communities_mutations;
  "communities/queries": typeof communities_queries;
  "contributions/mutations": typeof contributions_mutations;
  "contributions/queries": typeof contributions_queries;
  crons: typeof crons;
  "dms/mutations": typeof dms_mutations;
  "dms/queries": typeof dms_queries;
  files: typeof files;
  moderation: typeof moderation;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
  reports: typeof reports;
  translate: typeof translate;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/utils": typeof users_utils;
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
