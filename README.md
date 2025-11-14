# TrustStartup

A modern platform that lets founders verify their real-time Stripe revenue, display startup analytics publicly, and build trust with users, investors, and the community.
## API Reference

### 🔍 Get all startups
Fetches every public startup on TrustStartup.

```http
GET /api/startups


| Parameter | Type | Description                 |
| --------- | ---- | --------------------------- |
| None      | —    | Returns all public startups |

#### Get a specific startup
Fetch a single startup using its slug.

```http
  GET /api/startups/{slug}
```

| Parameter | Type     | Description                             |
| --------- | -------- | --------------------------------------- |
| `slug`    | `string` | **Required**. The startup’s unique slug |

#### Get revenue stats (Stripe-verified)
Pulled live from Stripe for real-time revenue charts.

POST /api/revenue

| Body Field  | Type     | Description                               |
| ----------- | -------- | ----------------------------------------- |
| `stripeKey` | `string` | **Required**. Startup’s secret Stripe key |
| `range`     | `string` | Optional: `7d`, `30d`, or `90d`           |

## Badges

Show important project info using dynamic shields.

[![Project Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Framework](https://img.shields.io/badge/Next.js-14-black?logo=next.js)]()
[![Database](https://img.shields.io/badge/Convex-Backend-blue?logo=vercel)]()
[![Stripe Verified](https://img.shields.io/badge/Stripe-Live%20Revenue-purple?logo=stripe)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-blue.svg)]()
## Color Reference

| Color Name        | Hex Code                                                           |
| ----------------- | ------------------------------------------------------------------ |
| Primary           | ![#4F46E5](https://via.placeholder.com/10/4F46E5?text=+) `#4F46E5` |
| Accent            | ![#6366F1](https://via.placeholder.com/10/6366F1?text=+) `#6366F1` |
| Background        | ![#FEFEFE](https://via.placeholder.com/10/FEFEFE?text=+) `#FEFEFE` |
| Dark Text         | ![#111827](https://via.placeholder.com/10/111827?text=+) `#111827` |
| Light Gray        | ![#F3F4F6](https://via.placeholder.com/10/F3F4F6?text=+) `#F3F4F6` |
| Success (Verified) | ![#10B981](https://via.placeholder.com/10/10B981?text=+) `#10B981` |
## Contributing

Contributions are always welcome!

See `context.md` for detailed guidelines and information before getting started.

Please make sure to follow this project's `code of conduct`.
## Deployment

Deploying **TrustStartup** is simple and automated.

To build and deploy the project, run:

```bash
npm run deploy
```
This will:

Build the production-ready Next.js app

Optimize all assets

Upload & deploy to your configured hosting platform (Vercel, Netlify, or your custom server)

If you're deploying on Vercel, you can also run:
```bash
vercel --prod
```

Your project will be live within seconds.
## Environment Variables

To run this project locally, create a `.env` file in the project root and add the following environment variables:

| Variable | Description |
|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex backend URL for client-side queries |
| `CONVEX_DEPLOYMENT` | Convex deployment identifier |
| `STRIPE_SECRET_KEY` | Your Stripe secret API key (test or live) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key used in client components |
| `EMBED_BASE_URL` | Your app's public domain for generating revenue badges |
| `NEXT_PUBLIC_APP_URL` | Public-facing URL of your website (e.g., https://truststartup.com) |

### Example `.env` File

```env
NEXT_PUBLIC_CONVEX_URL="https://your-convex.cloud"
CONVEX_DEPLOYMENT="prod:your-project-id"

STRIPE_SECRET_KEY="sk_test_***************"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_***************"

EMBED_BASE_URL="https://truststartup.com"
NEXT_PUBLIC_APP_URL="https://truststartup.com"
```
## Run Locally

Clone the project

```
git clone https://github.com/yourusername/truststartup.git
```

Go to the project directory
```
cd truststartup
```

Install dependencies
```
npm install
```

Set up environment variables
```
cp .env.example .env

```

Start the development server
```
npm run dev

```

Open the project in your browser:
```
http://localhost:3000

```

🛠️ Tip: Make sure your Convex backend is running or deployed before testing features that require data.

