# TrustStartup – Project Context

This document is the high-level map of the TrustStartup codebase and product.
Use it when you’re:

- Onboarding to the project
- Debugging end‑to‑end flows
- Planning new features or refactors

---

## 1. Product Overview

TrustStartup helps founders prove traction by exposing **Stripe‑verified revenue** on public pages and embeddable badges.

Core ideas:

- **Source of truth is Stripe** – No manual CSV uploads or screenshots.
- **Public visibility by default** – Each startup has a public page with revenue, bio, links, and charts.
- **Embeds & badges** – Founders can show a small “Verified revenue” badge on their own site.
- **Discovery** – A feed + sidebars show other startups and sponsored placements.

---

## 2. Architecture

### 2.1 Frontend

- **Framework:** Next.js 16 (App Router, React 19)
- **UI:** Tailwind CSS 4 + Radix UI primitives
- **Charts:** Recharts wrapped in `components/ui/chart.tsx`
- **State / data:**
  - `convex/react` hooks (`useQuery`, `useAction`) for all app data
  - Local React state for UI (dialogs, ranges, carousels, etc.)

Key locations:

- `app/layout.tsx` – Root layout, header/footer, global sidebars
- `app/page.tsx` – Home: hero, search, live leaderboard, and "Browse by category" chips
- `app/startup/[startup]/page.tsx` – Public startup profile + charts + embed dialog
- `app/category/[category]/page.tsx` – Category page showing startups filtered by `category` with live revenue
- `components/RevenueChart.tsx` – Stripe-driven revenue chart used on startup pages
- `components/sidebar.tsx` – Left/right sponsored startup sidebars and advertise dialog
- `components/Header.tsx`, `components/footer.tsx` – Global nav and footer

### 2.2 Backend / Data

- **Convex** is used for:
  - Storing startups, founders, sponsorships
  - Storing/deriving Stripe metrics
  - Realtime queries for dashboards and charts
- **Stripe** is used for:
  - Reading live revenue, MRR, and historical data
  - Sponsorship / advertising checkout flows

Key directories:

- `convex/` – Convex functions (queries, mutations, actions)
- `convex/_generated/` – Auto-generated Convex API bindings

You interact with Convex from the client via:

```ts
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const startups = useQuery(api.startups.getAllStartups);
const getLiveStripe = useAction(api.startups.getLiveStripeMetrics);
```

---

## 3. Key Flows

### 3.1 Public Startup Page (`/startup/[startup]`)

1. **Routing**
   - The dynamic segment `[startup]` is a slug derived from the startup name.
   - In `app/startup/[startup]/page.tsx`, the slug is inferred from `window.location.pathname` for client-side safety.

2. **Data loading**
   - `useQuery(api.startups.getAllStartups)` loads all startups.
   - The current startup is found by `slugify(startup.name) === routeSlug`.

3. **Live Stripe metrics**
   - `useAction(api.startups.getLiveStripeMetrics)` is polled every few seconds.
   - The result populates `live` state (`revenue`, `last30`, `mrr`, `createdAt`).

4. **UI pieces**
   - Header: avatar, name, badges, founder handle, category, links.
   - Metrics: GMV, last 30 days, MRR, founded date.
   - `RevenueChart`: daily revenue line, `mrr` and `last30` flat lines.
   - Carousel: “Discover more startups” section.
   - Embed dialog: Generate embed code + badge preview.

### 3.2 Revenue Chart

**File:** `components/RevenueChart.tsx`

Responsibilities:

- Read the startup’s Stripe key via `api.startups.getStartupStripeKey`.
- Fetch both **history** and **summary** metrics via Convex actions.
- Normalize/clean dates into timestamps and sort ascending.
- Render an `AreaChart` with:
  - `revenue` (area)
  - `last30` (flat line)
  - `mrr` (flat line)
- Provide a range selector for `7d / 30d / 90d`.
- Poll Convex every ~10 seconds for near‑realtime updates.

If Convex or Stripe are misconfigured, it gracefully falls back to empty/zero values.

### 3.3 Embeddable Badge API

**File:** `app/api/embed/[slug]/route.ts`

Flow:

1. Receive `GET /api/embed/{slug}`.
2. Use Convex (`api.startups.getAllStartups`) to resolve the startup by slug.
3. Generate a simple SVG badge with the startup name and revenue.
4. Respond with `Content-Type`: image/svg+xml`.

The startup page’s embed dialog uses this endpoint to show the preview and to build the `<img>` snippet that founders copy.

### 3.4 Category browsing (`/category/[category]`)

**File:** `app/category/[category]/page.tsx`

- Reads the current category from the URL (`/category/:category`).
- Uses `useQuery(api.startups.getAllStartups)` and filters by `startup.category` (case-insensitive).
- For the filtered list, polls `api.startups.getLiveStripeMetrics` every ~10s and merges the latest Stripe `revenue` into `liveData` per startup.
- Renders a responsive grid of cards showing avatar, name, bio, and **live revenue** per startup.

The home page (`app/page.tsx`) computes the list of distinct categories from `getAllStartups` and renders them as shadcn `<Button>` chips under the leaderboard. Clicking a chip navigates to the corresponding `/category/[category]` page.

---

## 4. Environments & Secrets

**Environment:**

- `.env.local` – local development
- Production – managed by your hosting provider (e.g. Vercel + Convex dashboard + Stripe dashboard)

**Critical secrets:**

- `STRIPE_SECRET_KEY` – never exposed to the browser.
- Convex deployment keys – managed via Convex CLI / dashboard.

Make sure:

- API routes that use Stripe secret keys only run server-side.
- Client components use `NEXT_PUBLIC_*` variants only.

---

## 5. Conventions

- **TypeScript first** – Prefer explicit interfaces and types for Convex payloads, page props, and API responses.
- **Client vs. server** –
  - `"use client"` at the top of interactive components.
  - API routes and Convex functions stay server-only.
- **Slug generation** – Use the shared `slugify` helper where possible to avoid mismatched URLs.
- **Polling** – Keep polling intervals modest (5–10s) to avoid Stripe / Convex overuse.

---

## 6. Working Locally

Minimal loop:

```bash
npm run dev        # Next.js dev server
# In parallel, run / configure your Convex deployment
```

If you change Convex schema or functions, run the Convex CLI as needed (see `convex/README.md`).

---

## 7. Adding New Features

When adding a new feature:

1. **Shape the data in Convex**
   - Add/extend tables and functions in `convex/`.
   - Expose typed functions via `api.*`.

2. **Expose it via API / UI**
   - For private dashboard features, call Convex directly from client components.
   - For public or embeddable features, optionally add Next.js API routes under `app/api/...`.

3. **Document it**
   - Update `README.md` (user‑facing overview) or this `context.md` (developer‑facing details).

---

## 8. Troubleshooting

Common issues:

- **Type mismatches between Next.js generated types and page/route signatures**
  - Ensure App Router page props and route handler context match the generated `PageProps` / `RouteHandler` expectations (see `.next/dev/types/...`).
- **Revenue not loading**
  - Check Convex functions for `stripeKey` usage and that environment variables are set.
  - Ensure the Stripe account has real or test data for the requested range.
- **Embeds show “Startup not found”**
  - Confirm slug generation in `slugify` is consistent between public pages and `/api/embed/[slug]`.

Use this document as the first stop before diving deep into the codebase.
