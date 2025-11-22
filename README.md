# TrustStartup

Real-time, Stripe-verified revenue pages for modern startups.

Founders connect their Stripe account, and TrustStartup turns live metrics into shareable public pages, embeddable badges, and investor-friendly charts.

---

## ✨ Features

- **Stripe-verified revenue** – Never fake screenshots again; all metrics are pulled directly from Stripe.
- **Public startup profiles** – SEO-friendly pages for each startup (e.g. `/startup/my-cool-saas`).
- **Live revenue charts** – Daily revenue history with MRR and last-30-days lines.
- **Browse by category** – Discover startups by vertical (SaaS, fintech, AI, etc.) via `/category/[category]` pages.
- **Embeddable badges** – Copy‑paste SVG/PNG badges that auto‑update as revenue changes.
- **Founder dashboard** – Manage startups, sponsorships, and embeds from one place.
- **Sponsored sidebars** – Affordable homepage placements (from **$20/month**) to feature your startup in rotating sidebars.

---

## 🧱 Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Backend / DB:** Convex
- **Payments:** Stripe
- **Charts:** Recharts
- **Styling:** Tailwind CSS 4, Radix UI primitives

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/yourusername/truststartup.git
cd truststartup
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local  # or create manually
```

Then fill in the values:

| Variable                             | Description                                                       |
| ------------------------------------ | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_CONVEX_URL`            | Convex backend URL for client-side queries                        |
| `CONVEX_DEPLOYMENT`                 | Convex deployment identifier                                      |
| `STRIPE_SECRET_KEY`                 | Stripe secret API key (test or live)                              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| Stripe publishable key used in client components                  |
| `EMBED_BASE_URL`                    | Public domain used to generate revenue badges                     |
| `NEXT_PUBLIC_APP_URL`               | Public-facing URL of your app (e.g. `https://truststartup.com`)  |

Example:

```env
NEXT_PUBLIC_CONVEX_URL="https://your-convex.cloud"
CONVEX_DEPLOYMENT="prod:your-project-id"

STRIPE_SECRET_KEY="sk_test_***************"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_***************"

EMBED_BASE_URL="https://truststartup.com"
NEXT_PUBLIC_APP_URL="https://truststartup.com"
```

### 3. Run the app locally

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

Make sure your Convex deployment is configured and reachable before testing data flows.

---

## 🌐 Routes & API Overview

### Core pages

- `/` – Home: hero, search, live leaderboard, and **Browse by category** chips.
- `/startup/[startup]` – Public startup profile with live Stripe metrics and revenue chart.
- `/category/[category]` – Filtered grid of startups for a given category, showing live revenue per startup.
- `/advertise` / `/advertise/success` / `/advertise/cancel` – Flow for purchasing sidebar sponsorships (from **$20/month**).

### HTTP API

This project also exposes a small HTTP surface for public data and embeds.

### `GET /api/startups`
Returns all public startups.

**Response:**

- `200 OK` – Array of startup objects suitable for listing and discovery.

### `GET /api/startups/{slug}`
Returns a single startup by its URL slug.

**Path params**

| Name   | Type     | Description                         |
| ------ | -------- | ----------------------------------- |
| `slug` | `string` | Unique slug for the startup profile |

### `POST /api/revenue`
Returns Stripe-verified revenue stats for a given Stripe key and range.

**Body**

| Field       | Type     | Description                                   |
| ----------- | -------- | --------------------------------------------- |
| `stripeKey` | `string` | **Required.** Startup’s Stripe secret key     |
| `range`     | `string` | Optional: `7d`, `30d`, or `90d`               |

> Note: This endpoint is intended for internal app usage; do **not** expose Stripe secret keys on the client.

---

## 🎨 Design Tokens

Primary colors used across the UI:

| Token              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| `--color-primary`  | ![#4F46E5](https://via.placeholder.com/10/4F46E5?text=+) `#4F46E5`|
| `--color-accent`   | ![#6366F1](https://via.placeholder.com/10/6366F1?text=+) `#6366F1`|
| `--color-bg`       | ![#FEFEFE](https://via.placeholder.com/10/FEFEFE?text=+) `#FEFEFE`|
| `--color-text`     | ![#111827](https://via.placeholder.com/10/111827?text=+) `#111827`|
| `--color-muted`    | ![#F3F4F6](https://via.placeholder.com/10/F3F4F6?text=+) `#F3F4F6`|
| `--color-verified` | ![#10B981](https://via.placeholder.com/10/10B981?text=+) `#10B981`|

---

## 🤝 Contributing

Contributions, bug reports, and feature ideas are welcome.

- Read `context.md` for architecture notes, conventions, and contribution flow.
- Open a PR with a clear description and screenshots when relevant.

Please follow the project’s code style and be mindful of production Stripe / Convex environments.

---

## 📦 Scripts

```bash
npm run dev     # Start local dev server
npm run build   # Create a production build
npm run start   # Run the production build
```

(If you use Vercel, the default Next.js build command is enough; no extra deploy script is required.)

---

## 📝 License

This project is open source under the MIT license.
