# Step-by-Step: Supabase + Vercel for “Works on Any Device”

Use this **exactly in order** so your appointment site uses one shared database instead of localStorage.

**In the Vercel Storage tab:** click **“Create”** next to **Supabase** (the one that says “Postgres backend” with the lightning icon).  
Do **not** use Neon for this guide—this project is set up for Supabase.

**Before deploy:** run `npm install` in the project root so `@supabase/supabase-js` is installed. Vercel will use it when deploying the new API routes.

---

## Step 1: Create a Supabase project (if you don’t have one)

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **“New Project”**.
3. Pick an organization (or create one), name the project (e.g. `appointment-booker`), set a **Database password** (save it somewhere safe), choose a region, then **Create new project**.
4. Wait until the project is ready (green “Project is ready” or similar).

---

## Step 2: In Vercel Storage, click “Create” next to **Supabase**

1. Open your **Vercel** project: **appointment-booker** (or whatever it’s named).
2. Go to the **Storage** tab (you’re already there if you see “Create a database” and Neon/Supabase).
3. Under **“Marketplace Database Providers”**, find **Supabase** (“Postgres backend” with the lightning icon).
4. Click the **“Create”** button next to Supabase (do **not** use Neon for this setup).
5. In the flow that opens:
   - Sign in to Supabase if asked.
   - **Link** your existing Supabase project (the one from Step 1), or choose “Create new project” if you prefer to create it from here.
   - Finish the flow so Vercel says the integration is connected.
6. After it’s connected, Vercel will add env vars like `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to this project. You don’t need to copy them manually.

---

## Step 3: Create the database tables in Supabase

1. In **[Supabase](https://supabase.com/dashboard)**, open your project.
2. In the left sidebar, open **“SQL Editor”**.
3. Click **“New query”**.
4. Paste the SQL below and run it (**Run** or Ctrl+Enter):

```sql
-- Slots: one row per available time slot
create table if not exists available_slots (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  time text not null,
  duration int not null default 1,
  booked boolean not null default false,
  created_at timestamptz default now()
);

-- Bookings: one row per booking (links to a slot)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references available_slots(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  session_type text not null,
  total_price numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- Optional: index for “slots by date”
create index if not exists idx_slots_date on available_slots(date);
create index if not exists idx_slots_booked on available_slots(booked);
```

5. You should see “Success” (or no errors). Your tables `available_slots` and `bookings` are ready.

---

## Step 4: Add instructor password in Vercel

The app checks the instructor password on the **server**, so it must be in Vercel, not in the frontend.

1. In **Vercel**, open your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `INSTRUCTOR_PASSWORD`
   - **Value:** the password instructors must use (e.g. the one you had in `app.js` before, or a new one).
   - **Environment:** Production (and Preview if you want it in preview deployments).
3. Save.

---

## Step 5: Set the API base URL in the frontend (if needed)

1. Open **app.js** in your repo.
2. Find `CONFIG.API_BASE` (or the place where the calendar API URL is set).
3. Set it to your **Vercel deployment URL** (no trailing slash), e.g.  
   `https://appointment-booker-seven.vercel.app`  
   so that:
   - Slots and bookings use: `CONFIG.API_BASE + '/api/slots'` and `CONFIG.API_BASE + '/api/bookings'`
   - Instructor login uses: `CONFIG.API_BASE + '/api/instructor/verify'`
4. Deploy again so the updated `app.js` is live.

---

## Step 6: Deploy and test

1. Push your code (including the new `api/slots.js`, `api/bookings.js`, `api/instructor/verify.js`) and let Vercel deploy.
2. Open your site.
3. **As a student:** pick date/time and book. The slot should be shared (e.g. open another device/browser and you should see it as booked).
4. **As instructor:** log in with `INSTRUCTOR_PASSWORD`, add/remove slots. Changes should appear for everyone and on every device.

---

## What you did

- **Step 1:** You have a Supabase project.
- **Step 2:** Vercel Storage → Create Supabase → you use one shared DB, and “works on any device” / “same data for everyone” comes from here.
- **Step 3:** Tables for slots and bookings exist.
- **Step 4:** Instructor password is stored only in Vercel.
- **Step 5–6:** The app uses the new API and shared DB instead of localStorage.

You **should** click **Supabase** “Create” in the Storage tab (not Neon) so the app matches this guide and uses the same schema and API.
