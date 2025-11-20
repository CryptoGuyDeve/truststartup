import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /* -------------------------------------------------------------------------- */
  /* 🧑 USERS TABLE                                                              */
  /* -------------------------------------------------------------------------- */
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
  }),

  /* -------------------------------------------------------------------------- */
  /* 🔐 SESSIONS TABLE                                                           */
  /* -------------------------------------------------------------------------- */
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.string(),
  }),

  /* -------------------------------------------------------------------------- */
  /* 🚀 STARTUPS TABLE                                                           */
  /* -------------------------------------------------------------------------- */
  startups: defineTable({
    name: v.string(),
    company: v.optional(v.string()),

    // Website field
    website: v.optional(v.string()),

    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    category: v.optional(v.string()),
    stripeKey: v.string(),
    twitter: v.optional(v.string()),

    // Founder
    userId: v.optional(v.id("users")),
    createdAt: v.string(),

    /* ------------------------------ FINANCIAL METRICS ------------------------------ */
    revenue: v.optional(v.number()),
    last30Days: v.optional(v.number()),   // <-- ADD THIS
    mrr: v.optional(v.number()),          // <-- ADD THIS
    lastSynced: v.optional(v.string()),

    /* ------------------------------ SPONSORSHIP FIELDS ------------------------------ */
    isSponsored: v.optional(v.boolean()), // is this startup advertised?
    sponsorSince: v.optional(v.string()), // start date
    sponsorSlot: v.optional(v.number()), // sidebar slot (1–20)

    sponsorDurationMonths: v.optional(v.number()), // paid duration
    sponsorExpiresAt: v.optional(v.string()), // single clean expiry

    /* ------------------------------ AD ANALYTICS ------------------------------ */
    adViews: v.optional(v.number()), // impressions
    adClicks: v.optional(v.number()), // clicks
    adGeneratedRevenue: v.optional(v.number()), // revenue created through ad
  }),
});
