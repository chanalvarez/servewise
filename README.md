# ServeWise

A high-performance, real-time multi-mall virtual queuing system. Customers join store queues across different malls with no account required. Staff manage queues via a dedicated dashboard.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide icons
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, pg_cron)
- **Identity**: Supabase Anonymous Auth (no sign-up required for customers)

## Getting Started

### Prerequisites

Install [Node.js 20+](https://nodejs.org/) and [npm](https://www.npmjs.com/).

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql` in full
3. Run `supabase/seed.sql` to populate sample malls and stores
4. Enable **Anonymous Sign-ins** in **Authentication → Providers → Anonymous**
5. Enable **pg_cron** in **Database → Extensions** (search for `pg_cron`)

### 2. Configure environment

Copy `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local .env.local.bak   # backup the template
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in **Project Settings → API**.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Creating Staff Accounts

1. In Supabase Dashboard → **Authentication → Users → Add user**, create an email/password user
2. Copy their UUID
3. In **SQL Editor**, link them to a store:

```sql
INSERT INTO staff (id, store_id, name)
VALUES (
  '<auth-user-uuid>',
  (SELECT id FROM stores WHERE name = 'Starbucks Coffee' LIMIT 1),
  'Store Manager'
);
```

Staff can then log in at `/{mallSlug}/{storeId}/staff`.

---

## URL Structure

| Path | Description |
|------|-------------|
| `/` | Mall selection landing page |
| `/{mallSlug}` | Store directory for a mall |
| `/{mallSlug}/{storeId}` | Customer queue view (join queue) |
| `/{mallSlug}/{storeId}/staff` | Staff dashboard (auth required) |
| `/{mallSlug}/{storeId}/staff/login` | Staff login |

---

## Key Features

- **Real-time "Now Serving"** — Supabase Realtime WebSocket subscriptions push queue updates instantly
- **My Active Tickets drawer** — persists across all pages via React context; floats above the page
- **Multiple simultaneous queues** — join any number of stores at once
- **5-minute no-show protocol** — staff marks no-show; pg_cron auto-voids after 5 min if customer doesn't arrive
- **Vibe status** — staff toggle store occupancy (not busy / moderate / very busy); updates live on the directory
- **Anonymous auth** — customers need no account; Supabase anonymous auth provides a persistent identity for RLS
