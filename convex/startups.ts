import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/* -------------------------------------------------------------------------- */
/* ⚙️ Helper: safe fetch wrapper and Stripe parsers                            */
/* -------------------------------------------------------------------------- */

async function safeFetchJson(url: string, opts: RequestInit = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.error("safeFetchJson error:", err);
    return null;
  }
}

/**
 * fetchStripeMetrics - lightweight summary (used when creating/startup sync)
 * returns revenue (all-time) and mrr (estimated).
 */
async function fetchStripeMetrics(stripeKey: string) {
  try {
    // charges (all-time, limited to 100 most recent — good enough for small examples)
    const chargesJson = await safeFetchJson(
      "https://api.stripe.com/v1/charges?limit=100",
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );

    const gmvAllTime =
      (chargesJson?.data || [])
        .filter((c: any) => c.paid && c.amount)
        .reduce((s: number, c: any) => s + (c.amount || 0), 0) / 100 || 0;

    // subscriptions -> mrr estimate
    const subsJson = await safeFetchJson(
      "https://api.stripe.com/v1/subscriptions?limit=100",
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );

    const mrr =
      (subsJson?.data || [])
        .filter((s: any) => s.status === "active")
        .reduce(
          (sum: number, s: any) =>
            sum + ((s.items?.data?.[0]?.plan?.amount || 0) as number),
          0
        ) / 100 || 0;

    return { revenue: gmvAllTime, mrr };
  } catch (err) {
    console.error("fetchStripeMetrics error:", err);
    return { revenue: 0, mrr: 0 };
  }
}

/* -------------------------------------------------------------------------- */
/* 📌 getStartupStripeKey - safe query (only returns the key)                 */
/* -------------------------------------------------------------------------- */
export const getStartupStripeKey = query({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id);
    if (!s) return null;
    return { stripeKey: s.stripeKey };
  },
});

/* -------------------------------------------------------------------------- */
/* 📈 getRevenueHistoryAction - Action (can use fetch)                        */
/* - Returns daily aggregated array: [{ date: <ms timestamp>, revenue: number }] */
/* - range: "7d" | "30d" | "90d"                                                */
/* -------------------------------------------------------------------------- */
export const getRevenueHistoryAction = action({
  args: { stripeKey: v.string(), range: v.string() },
  handler: async (ctx, args) => {
    const { stripeKey, range } = args;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

    const startTimestamp = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

    // fetch charges since startTimestamp
    const res = await safeFetchJson(
      `https://api.stripe.com/v1/charges?limit=100&created[gte]=${startTimestamp}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );

    const charges = (res?.data || []).filter((c: any) => c.paid && c.amount);

    // Aggregate by day (UTC) to produce continuous daily points
    const dayMap = new Map<number, number>(); // key = midnight UTC ms, value = revenue

    // initialize all days to 0 so the chart has continuous points
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      dayMap.set(d.getTime(), 0);
    }

    for (const c of charges) {
      const ts = (c.created || 0) * 1000;
      const d = new Date(ts);
      d.setUTCHours(0, 0, 0, 0);
      const key = d.getTime();
      const prev = dayMap.get(key) ?? 0;
      dayMap.set(key, prev + (c.amount || 0) / 100);
    }

    // transform to sorted array (ascending by date)
    const result = Array.from(dayMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dateMs, revenue]) => ({
        date: dateMs, // ms timestamp for charts
        revenue: Math.round(revenue * 100) / 100, // round to 2 decimals
      }));

    return result;
  },
});

/* -------------------------------------------------------------------------- */
/* 📊 getStripeSummaryMetrics - Action (real-time summary: GMV, last30, MRR)  */
/* -------------------------------------------------------------------------- */
export const getStripeSummaryMetrics = action({
  args: { stripeKey: v.string() },
  handler: async (ctx, args) => {
    const { stripeKey } = args;

    // 1) GMV (all-time) - limited to latest 100 charges for safety
    const chargesJson = await safeFetchJson(
      "https://api.stripe.com/v1/charges?limit=100",
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );

    const gmvAllTime =
      (chargesJson?.data || [])
        .filter((c: any) => c.paid && c.amount)
        .reduce((s: number, c: any) => s + (c.amount || 0), 0) / 100 || 0;

    // 2) last 30 days
    const last30Ts = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recentJson = await safeFetchJson(
      `https://api.stripe.com/v1/charges?limit=100&created[gte]=${last30Ts}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );

    const last30 =
      (recentJson?.data || [])
        .filter((c: any) => c.paid && c.amount)
        .reduce((sum: number, c: any) => sum + (c.amount || 0), 0) / 100 || 0;

    // 3) MRR (estimated)
    const subsJson = await safeFetchJson(
      "https://api.stripe.com/v1/subscriptions?limit=100",
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );

    const mrr =
      (subsJson?.data || [])
        .filter((s: any) => s.status === "active")
        .reduce(
          (sum: number, s: any) =>
            sum + (s.items?.data?.[0]?.plan?.amount || 0),
          0
        ) / 100 || 0;

    // 4) Account createdAt (if available)
    let createdAt = "";
    const acctJson = await safeFetchJson("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (acctJson && acctJson.created) {
      createdAt = new Date(acctJson.created * 1000).toISOString();
    }

    return {
      gmvAllTime: Math.round((gmvAllTime || 0) * 100) / 100,
      last30: Math.round((last30 || 0) * 100) / 100,
      mrr: Math.round((mrr || 0) * 100) / 100,
      createdAt,
    };
  },
});

/* -------------------------------------------------------------------------- */
/* ➕ addStartup - create startup + fetch initial metrics + website field      */
/* -------------------------------------------------------------------------- */
export const addStartup = mutation({
  args: {
    name: v.string(),
    company: v.optional(v.string()),
    website: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    category: v.optional(v.string()),
    stripeKey: v.string(),
    twitter: v.optional(v.string()),
    userToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId: Id<"users"> | undefined;

    if (args.userToken) {
      const session = await ctx.db
        .query("sessions")
        .filter((q) => q.eq(q.field("token"), args.userToken))
        .unique();

      if (session) userId = session.userId;
    }

    const { revenue, mrr } =
      (await fetchStripeMetrics(args.stripeKey)) || { revenue: 0, mrr: 0 };

    const startupId = await ctx.db.insert("startups", {
      name: args.name,
      company: args.company ?? "",
      website: args.website ?? "",
      avatar: args.avatar ?? "",
      bio: args.bio ?? "",
      category: args.category ?? "",
      stripeKey: args.stripeKey,
      twitter: args.twitter ?? "",
      createdAt: new Date().toISOString(),
      userId,
      revenue: revenue ?? 0,
      mrr: mrr ?? 0,
      lastSynced: new Date().toISOString(),

      // ⭐ SPONSOR FIELDS FIXED
      isSponsored: false,
      sponsorSince: undefined,
      sponsorSlot: undefined,
    });

    return { startupId };
  },
});


/* -------------------------------------------------------------------------- */
/* ✏️ updateStartup - edit basic fields                                       */
/* -------------------------------------------------------------------------- */
export const updateStartup = mutation({
  args: {
    id: v.id("startups"),
    name: v.string(),
    bio: v.string(),
    avatar: v.string(),
  },
  handler: async (ctx, args) => {
    const startup = await ctx.db.get(args.id);
    if (!startup) throw new Error("Startup not found");

    await ctx.db.patch(args.id, {
      name: args.name,
      bio: args.bio,
      avatar: args.avatar,
    });

    return { success: true };
  },
});

/* -------------------------------------------------------------------------- */
/* 🔑 updateStripeKey - change key and auto-sync                               */
/* -------------------------------------------------------------------------- */
export const updateStripeKey = mutation({
  args: { id: v.id("startups"), stripeKey: v.string(), userToken: v.string() },
  handler: async (ctx, args) => {
    const startup = await ctx.db.get(args.id);
    if (!startup) throw new Error("Startup not found");

    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), args.userToken))
      .unique();

    if (!session || session.userId !== startup.userId)
      throw new Error("Unauthorized");

    // update key immediately
    await ctx.db.patch(args.id, { stripeKey: args.stripeKey });

    // try to refresh metrics now
    const { revenue, mrr } = (await fetchStripeMetrics(args.stripeKey)) || {
      revenue: 0,
      mrr: 0,
    };

    await ctx.db.patch(args.id, {
      revenue: revenue ?? 0,
      mrr: mrr ?? 0,
      lastSynced: new Date().toISOString(),
    });

    return { success: true };
  },
});

/* -------------------------------------------------------------------------- */
/* 🔄 syncStripeRevenue - manual sync by founder                               */
/* -------------------------------------------------------------------------- */
export const syncStripeRevenue = mutation({
  args: { id: v.id("startups"), userToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const startup = await ctx.db.get(args.id);
    if (!startup) throw new Error("Startup not found");

    const session = args.userToken
      ? await ctx.db
          .query("sessions")
          .filter((q) => q.eq(q.field("token"), args.userToken))
          .unique()
      : null;

    if (!session || session.userId !== startup.userId) {
      throw new Error("Unauthorized — Founder only");
    }

    const { revenue, mrr } = (await fetchStripeMetrics(startup.stripeKey)) || {
      revenue: 0,
      mrr: 0,
    };

    await ctx.db.patch(args.id, {
      revenue: revenue ?? 0,
      mrr: mrr ?? 0,
      lastSynced: new Date().toISOString(),
    });

    return { success: true, revenue: revenue ?? 0, mrr: mrr ?? 0 };
  },
});

/* -------------------------------------------------------------------------- */
/* 📌 getStartupById                                                            */
/* -------------------------------------------------------------------------- */
export const getStartupById = query({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id);
    if (!s) return null;

    // fetch founder
    const founder = s.userId ? await ctx.db.get(s.userId) : null;

    return {
      _id: s._id,
      name: s.name,
      bio: s.bio ?? "",
      avatar: s.avatar ?? "",

      // Stripe fields
      stripeKey: s.stripeKey ?? null,
      revenue: s.revenue ?? 0,
      last30Days: s.last30Days ?? 0,
      mrr: s.mrr ?? 0,

      // public metadata
      website: s.website ?? "",
      category: s.category ?? "",
      twitter: s.twitter ?? "",

      // sponsorship
      isSponsored: s.isSponsored ?? false,
      sponsorSlot: s.sponsorSlot ?? null,
      sponsorSince: s.sponsorSince ?? null,
      sponsorDurationMonths: s.sponsorDurationMonths ?? 0,
      sponsorExpiresAt: s.sponsorExpiresAt ?? null,

      // Ads
      adViews: s.adViews ?? 0,
      adClicks: s.adClicks ?? 0,
      adGeneratedRevenue: s.adGeneratedRevenue ?? 0,

      createdAt: s.createdAt,
      founder,
    };
  },
});


/* -------------------------------------------------------------------------- */
/* 🏆 getAllStartups - leaderboard (enriched with founder)                     */
/* -------------------------------------------------------------------------- */
export const getAllStartups = query({
  args: {},
  handler: async (ctx) => {
    const startups = await ctx.db.query("startups").collect();

    const enriched = await Promise.all(
      startups.map(async (s) => {
        let founder = null;
        if (s.userId) founder = await ctx.db.get(s.userId);

        return {
          _id: s._id,
          name: s.name,
          bio: s.bio ?? "",
          avatar: s.avatar ?? "",
          revenue: s.revenue ?? 0,
          last30Days: s.last30Days ?? 0,
          mrr: s.mrr ?? 0,
          stripeKey: s.stripeKey ?? null,   // ⭐ REQUIRED FOR LIVE REVENUE
          website: s.website ?? "",
          twitter: s.twitter ?? "",
          category: s.category ?? "",
          createdAt: s.createdAt,
          founder,
        };
      })
    );

    // sort by revenue desc (fallback 0)
    return enriched.sort((a, b) => {
      if ((b.revenue ?? 0) === (a.revenue ?? 0)) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return (b.revenue ?? 0) - (a.revenue ?? 0);
    });
  },
});

/* -------------------------------------------------------------------------- */
/* 🔍 searchStartups (now includes website)                                   */
/* -------------------------------------------------------------------------- */
export const searchStartups = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("startups").collect();
    const qLower = args.q.toLowerCase();

    return all.filter((s) =>
      [
        s.name,
        s.company,
        s.website, // ⭐ NEW SEARCH FIELD
        s.category,
        s.twitter,
        s.bio,
      ]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(qLower))
    );
  },
});

/* -------------------------------------------------------------------------- */
/* 📣 getSponsoredStartups - returns startups currently sponsored (limited)   */
/* -------------------------------------------------------------------------- */
export const getSponsoredStartups = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    // query all and filter because convex query filters on dynamic fields can be limited;
    // for small dataset it's ok — for scale consider adding a sponsored index or flag collection
    const all = await ctx.db.query("startups").collect();
    const sponsored = all.filter((s) => s.isSponsored).slice(0, limit);

    const enriched = await Promise.all(
      sponsored.map(async (s) => {
        let founder = null;
        if (s.userId) founder = await ctx.db.get(s.userId);
        return { ...s, founder };
      })
    );

    // sort by sponsorSlot ascending (so slot 1 shows first), then revenue desc
    enriched.sort((a, b) => {
      const aSlot = a.sponsorSlot ?? 999;
      const bSlot = b.sponsorSlot ?? 999;
      if (aSlot !== bSlot) return aSlot - bSlot;
      return (b.revenue ?? 0) - (a.revenue ?? 0);
    });

    return enriched;
  },
});

/* -------------------------------------------------------------------------- */
/* 🔐 assignSponsorSlot - claim/lock a sponsor slot for a startup              */
/* - Should be called after successful payment (webhook or server-side)       */
/* - Checks if slot is free and assigns it.                                  */
/* -------------------------------------------------------------------------- */
export const assignSponsorSlot = mutation({
  args: {
    id: v.id("startups"),
    slot: v.number(),
    userToken: v.optional(v.string()),
    durationMonths: v.optional(v.number()),  // defaults to 1 month if not given
  },
  handler: async (ctx, args) => {
    const { id, slot, userToken, durationMonths } = args;

    if (slot < 1 || slot > 1000) {
      throw new Error("Invalid slot number");
    }

    const startup = await ctx.db.get(id);
    if (!startup) throw new Error("Startup not found");

    // Optional authorization (if requested)
    if (userToken) {
      const session = await ctx.db
        .query("sessions")
        .filter((q) => q.eq(q.field("token"), userToken))
        .unique();

      if (!session || session.userId !== startup.userId)
        throw new Error("Unauthorized");
    }

    // Check if slot is free
    const all = await ctx.db.query("startups").collect();
    const occupied = all.find((s) => s.sponsorSlot === slot && s._id !== id);

    if (occupied) {
      throw new Error(`Slot ${slot} is already occupied`);
    }

    const now = new Date();
    const months = durationMonths ?? 1;

    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + months);

    await ctx.db.patch(id, {
      isSponsored: true,
      sponsorSince: now.toISOString(),
      sponsorSlot: slot,
      sponsorDurationMonths: months,
      sponsorExpiresAt: expires.toISOString(),

      // reset analytics
      adViews: 0,
      adClicks: 0,
      adGeneratedRevenue: 0,
    });

    return {
      success: true,
      slot,
      sponsorSince: now.toISOString(),
      sponsorExpiresAt: expires.toISOString(),
    };
  },
});



/* -------------------------------------------------------------------------- */
/* 🧍 getUserStartups                                                            */
/* -------------------------------------------------------------------------- */
export const getUserStartups = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), args.token))
      .unique();

    if (!session) return [];

    return ctx.db
      .query("startups")
      .filter((q) => q.eq(q.field("userId"), session.userId))
      .collect();
  },
});

/* -------------------------------------------------------------------------- */
/* ❌ deleteStartup                                                             */
/* -------------------------------------------------------------------------- */
export const deleteStartup = mutation({
  args: { id: v.id("startups"), userToken: v.string() },
  handler: async (ctx, args) => {
    const startup = await ctx.db.get(args.id);
    if (!startup) throw new Error("Startup not found");

    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), args.userToken))
      .unique();

    if (!session || session.userId !== startup.userId)
      throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/* -------------------------------------------------------------------------- */
/* 🔄 refreshAll - admin background sync (patch revenue/mrr)                   */
/* -------------------------------------------------------------------------- */
export const refreshAll = mutation({
  args: {},
  handler: async (ctx) => {
    const startups = await ctx.db.query("startups").collect();

    for (const s of startups) {
      if (s.stripeKey) {
        const { revenue, mrr } = (await fetchStripeMetrics(s.stripeKey)) || {
          revenue: 0,
          mrr: 0,
        };
        await ctx.db.patch(s._id, {
          revenue: revenue ?? 0,
          mrr: mrr ?? 0,
          lastSynced: new Date().toISOString(),
        });
      }
    }

    return { success: true };
  },
});

export const getLiveStripeMetrics = action({
  args: { stripeKey: v.string() },
  handler: async (ctx, { stripeKey }) => {
    try {
      const chargesRes = await fetch(
        "https://api.stripe.com/v1/charges?limit=100",
        { headers: { Authorization: `Bearer ${stripeKey}` } }
      );
      const charges = await chargesRes.json();

      const revenue =
        (charges?.data || [])
          .filter((c: any) => c.paid && c.amount)
          .reduce((s: number, c: any) => s + c.amount, 0) / 100;

      const subRes = await fetch(
        "https://api.stripe.com/v1/subscriptions?limit=100",
        { headers: { Authorization: `Bearer ${stripeKey}` } }
      );
      const subs = await subRes.json();

      const mrr =
        (subs?.data || [])
          .filter((s: any) => s.status === "active")
          .reduce(
            (sum: number, s: any) =>
              sum + (s.items?.data?.[0]?.plan?.amount ?? 0),
            0
          ) / 100;

      return { revenue, mrr };
    } catch (err) {
      console.error("Stripe live error:", err);
      return { revenue: 0, mrr: 0 };
    }
  },
});


/* -------------------------------------------------------------------------- */
/* ❌ cancelSponsor – user stops advertising                                  */
/* -------------------------------------------------------------------------- */
export const cancelSponsor = mutation({
  args: { id: v.id("startups"), userToken: v.string() },
  handler: async (ctx, args) => {
    const { id, userToken } = args;

    const startup = await ctx.db.get(id);
    if (!startup) throw new Error("Startup not found");

    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), userToken))
      .unique();

    if (!session || session.userId !== startup.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(id, {
      isSponsored: false,
      sponsorSlot: undefined,
      sponsorSince: undefined,
      sponsorExpiresAt: undefined,
    });

    return { success: true };
  },
});


export const trackAdView = mutation({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id);
    if (!s) return;

    await ctx.db.patch(args.id, {
      adViews: (s.adViews ?? 0) + 1,
    });
  },
});

export const trackAdClick = mutation({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.id);
    if (!s) return;

    await ctx.db.patch(args.id, {
      adClicks: (s.adClicks ?? 0) + 1,
    });
  },
});

export const expireSponsors = mutation({
  args: {},
  handler: async (ctx) => {
    const startups = await ctx.db.query("startups").collect();

    const now = new Date();

    for (const s of startups) {
      if (s.sponsorExpiresAt && new Date(s.sponsorExpiresAt) < now) {
        await ctx.db.patch(s._id, {
          isSponsored: false,
          sponsorSlot: undefined,
        });
      }
    }

    return { success: true };
  },
});
/* -------------------------------------------------------------------------- */
/* ➕ extendSponsorDuration – add more months                                 */
/* -------------------------------------------------------------------------- */
export const extendSponsorDuration = mutation({
  args: {
    id: v.id("startups"),
    userToken: v.string(),
    months: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, userToken, months } = args;

    const startup = await ctx.db.get(id);
    if (!startup) throw new Error("Startup not found");

    const session = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("token"), userToken))
      .unique();

    if (!session || session.userId !== startup.userId) {
      throw new Error("Unauthorized");
    }

    const now = new Date();
    const currentExpiry = startup.sponsorExpiresAt
      ? new Date(startup.sponsorExpiresAt)
      : now;

    // Add months
    currentExpiry.setMonth(currentExpiry.getMonth() + months);

    await ctx.db.patch(id, {
      isSponsored: true,
      sponsorExpiresAt: currentExpiry.toISOString(),
    });

    return {
      success: true,
      newExpiry: currentExpiry.toISOString(),
    };
  },
});

export const getStartupsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const startups = await ctx.db
      .query("startups")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return await Promise.all(
      startups.map(async (s) => {
        // fetch founder
        const founder = s.userId ? await ctx.db.get(s.userId) : null;

        return {
          _id: s._id,
          name: s.name,
          bio: s.bio ?? "",
          avatar: s.avatar ?? "",

          // ⭐ Stripe/Revenue fields
          stripeKey: s.stripeKey ?? null,
          revenue: s.revenue ?? 0,
          last30Days: s.last30Days ?? 0,
          mrr: s.mrr ?? 0,

          // Public metadata
          website: s.website ?? "",
          category: s.category ?? "",
          twitter: s.twitter ?? "",

          // Sponsorship
          isSponsored: s.isSponsored ?? false,
          sponsorSlot: s.sponsorSlot ?? null,
          sponsorSince: s.sponsorSince ?? null,
          sponsorDurationMonths: s.sponsorDurationMonths ?? 0,
          sponsorExpiresAt: s.sponsorExpiresAt ?? null,

          // Ad metrics
          adViews: s.adViews ?? 0,
          adClicks: s.adClicks ?? 0,
          adGeneratedRevenue: s.adGeneratedRevenue ?? 0,

          // Founder info
          founder,

          createdAt: s.createdAt,
        };
      })
    );
  },
});
