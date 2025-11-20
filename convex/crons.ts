import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// 🕕 Automatically refresh Stripe metrics every 6 hours
crons.interval(
  "refreshStripeMetrics",
  { hours: 6 }, // Runs every 6 hours
  api.startups.refreshAll // ✅ your mutation reference
);

export default crons;
