import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { joinWaitlist } from "./utils";

export const join = mutation({
    args: { visitorId: v.optional(v.string()) },
    handler: joinWaitlist,
});
