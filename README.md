# ServeWise

> Skip the line, virtually.

ServeWise is a real-time virtual queue management system for shopping malls. Customers scan a QR code at the mall entrance, browse stores, and join queues instantly — no app download, no account required. Store staff manage their queue from a dedicated dashboard on any device.

---

## Try It Now

Scan the QR code below with your phone to access ServeWise:

<p align="center">
  <img src="public/qr-servewise.png" alt="ServeWise QR Code" width="220" />
</p>

<p align="center">
  Or visit: <a href="https://servewise.vercel.app">https://servewise.vercel.app</a>
</p>

---

## Features

### For Customers
- **QR code entry** — scan once at the mall entrance, access every store's queue
- **No app, no account** — works entirely in the phone's browser; anonymous session is created automatically
- **Browse & filter** — search stores by name or filter by category; live busyness indicator per store
- **Instant ticket** — join a queue and get a numbered ticket in seconds
- **Live tracking** — "Now Serving" board updates in real time without refreshing
- **Multi-queue** — hold tickets at multiple stores at the same time
- **Active tickets drawer** — always accessible, floats above every page
- **No-show countdown** — if called but not present, a 5-minute timer appears before the ticket is voided
- **Queue closed notice** — clear warning when a store has stopped accepting new customers

### For Staff
- **Secure login** — email and password, scoped to a single store
- **Live queue panel** — see all waiting, called, and no-show tickets in real time
- **Call next** — one tap advances the queue; the previous ticket auto-completes
- **No-show** — marks the current customer; pg_cron auto-voids the ticket after 5 minutes
- **Vibe toggle** — broadcast store occupancy (Not Busy / Moderate / Very Busy) to the customer directory
- **Open / Close** — controls whether the store accepts new queue entries
- **Queue cutoff** — stops new joins near closing time; customers already in queue are unaffected

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — anonymous for customers, email/password for staff |
| Real-time | Supabase Realtime (WebSocket) |
| Scheduled jobs | pg_cron — auto-voids no-show tickets after 5 minutes |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Set up the database

In your Supabase project, go to **SQL Editor** and run:

1. `supabase/schema.sql` — creates all tables, RLS policies, and RPCs
2. `supabase/seed.sql` — populates sample malls and stores

Then enable two things in your Supabase dashboard:
- **Authentication → Providers → Anonymous** — turn on Anonymous Sign-ins
- **Database → Extensions** — enable `pg_cron`

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in **Supabase → Project Settings → API**.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Creating Staff Accounts

Staff accounts are created manually through the Supabase dashboard.

1. Go to **Authentication → Users → Add user** and create an email/password user
2. Copy the user's UUID
3. Run this in **SQL Editor** to link them to a store:

```sql
INSERT INTO staff (id, store_id, name)
VALUES (
  '<user-uuid>',
  (SELECT id FROM stores WHERE name = 'Store Name' LIMIT 1),
  'Staff Name'
);
```

Staff can then log in at `/{mallSlug}/{storeId}/staff/login`.

---

## URL Structure

| Path | Page |
|---|---|
| `/` | Home — mall selection |
| `/{mallSlug}` | Store directory for a mall |
| `/{mallSlug}/{storeId}` | Customer queue view |
| `/{mallSlug}/{storeId}/staff/login` | Staff login |
| `/{mallSlug}/{storeId}/staff` | Staff dashboard |

QR codes at mall entrances point to `/{mallSlug}`.

---

## Database Schema

```
malls              stores                   tickets
─────              ──────                   ───────
id                 id                       id
name               mall_id → malls          store_id → stores
slug               name                     customer_id
address            category                 queue_number
city               floor / unit_number      status
                   vibe_status              no_show_triggered_at
                   current_serving          created_at / updated_at
                   last_queue_number
                   is_open
                   is_cutoff

staff
─────
id → auth.users
store_id → stores
name
```

---

## Security

All tables have **Row Level Security (RLS)** enabled at the database level. Key rules:

- Customers can only read their own tickets
- Staff can only update their own store
- All queue operations run through `SECURITY DEFINER` RPCs — no direct table writes from clients
- Joining a queue is blocked at the database level if the store is closed or in cutoff mode
- No personal data is collected from customers — anonymous sessions only

---

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com) with zero configuration:

```bash
vercel deploy
```

Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings before deploying.
