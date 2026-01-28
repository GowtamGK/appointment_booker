# Motorcycle Training Booking System

A modern, responsive appointment booking system for motorcycle driving training sessions. Customers book training sessions; instructors manage available time slots. **Slots and bookings are stored in Supabase** (connected via Vercel)—same data for everyone, works on any device. No localStorage.

## Features

- **Three Session Types:**
  - Training Session: $60 CAD/hour
  - MST: $75 CAD/hour
  - Class 6: $100 CAD/hour

- **Customer Features:**
  - View and select available time slots (from shared Supabase DB)
  - Book appointments with customer details
  - Automatic price calculation
  - Email notifications to instructor
  - Bookings visible across all devices and users

- **Instructor Features:**
  - Password-protected instructor panel (password checked on server, stored in Vercel env)
  - Add available time slots for future dates
  - Remove available slots
  - View all slots (booked and available)
  - Warning banner for unauthorized users
  - View booking/customer details in Supabase Dashboard (Table Editor → `bookings`)

- **Backend & Storage:**
  - Supabase (Postgres) for slots and bookings—single source of truth
  - Vercel serverless APIs: `/api/slots`, `/api/bookings`, `/api/instructor/verify`
  - Instructor password stored only in Vercel env (`INSTRUCTOR_PASSWORD`)

- **Automation:**
  - Automatic calendar event creation (Google Calendar via Vercel serverless)
  - Email notifications to instructor (EmailJS)

## Setup Instructions

### 1. Supabase + Vercel (Slots & Bookings—No localStorage)

Slots and bookings live in Supabase. **Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** for full steps. Summary:

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **In Vercel:** open your project → **Storage** tab → click **Create** next to **Supabase** (not Neon). Link your Supabase project so Vercel gets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. **In Supabase:** SQL Editor → run the schema from SUPABASE_SETUP.md to create `available_slots` and `bookings` tables.
4. **In Vercel:** Settings → Environment Variables → add `INSTRUCTOR_PASSWORD` (the password instructors use to log in).
5. **In `app.js`:** set `CONFIG.API_BASE` to your Vercel deployment URL (e.g. `https://your-app.vercel.app`) with no trailing slash.
6. Run `npm install` and deploy. The app will use the API instead of localStorage.

**Viewing user/booking details:** Supabase Dashboard → **Table Editor** → **`bookings`** table. Columns include `customer_name`, `customer_email`, `customer_phone`, `session_type`, `total_price`, `notes`, `created_at`.

### 2. EmailJS Setup (Free Email Service)

EmailJS is a free service that allows sending emails directly from the browser without a backend server.

1. **Sign up for EmailJS:**
   - Go to [https://www.emailjs.com/](https://www.emailjs.com/)
   - Create a free account (200 emails/month free)

2. **Create an Email Service:**
   - Go to "Email Services" in your dashboard
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions
   - Note your **Service ID**

3. **Create an Email Template:**
   - Go to "Email Templates" in your dashboard
   - Click "Create New Template"
   - Use this template structure:
     ```
     Subject: New Motorcycle Training Booking - {{session_type}}
     
     Body:
     A new booking has been made:
     
     Customer Name: {{customer_name}}
     Customer Email: {{customer_email}}
     Customer Phone: {{customer_phone}}
     
     Session Details:
     Type: {{session_type}}
     Date: {{date}}
     Time: {{time}}
     Duration: {{duration}} hour(s)
     Total Price: ${{total_price}} CAD
     
     Notes: {{notes}}
     
     Calendar Event ID: {{calendar_event_id}}
     ```
   - Note your **Template ID**

4. **Get Your Public Key:**
   - Go to "Account" → "General"
   - Copy your **Public Key**

5. **Update Configuration:**
   - Open `app.js`
   - Replace the values in `EMAILJS_CONFIG`:
     ```javascript
     const EMAILJS_CONFIG = {
         SERVICE_ID: 'your_service_id_here',
         TEMPLATE_ID: 'your_template_id_here',
         PUBLIC_KEY: 'your_public_key_here'
     };
     ```

### 3. Google Calendar API Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API:**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost` (for testing)
     - `https://yourusername.github.io` (for GitHub Pages)
   - Add authorized redirect URIs:
     - `http://localhost` (for testing)
     - `https://yourusername.github.io` (for GitHub Pages)
   - Copy your **Client ID**

4. **Create API Key:**
   - Still in "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your **API Key**
   - (Optional) Restrict the API key to Google Calendar API only

5. **Update Configuration:**
   - Open `app.js`
   - Replace the values in `CALENDAR_CONFIG`:
     ```javascript
     const CALENDAR_CONFIG = {
         CLIENT_ID: 'your_client_id_here',
         API_KEY: 'your_api_key_here',
         DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
         SCOPES: 'https://www.googleapis.com/auth/calendar.events'
     };
     ```

### 4. Deploy (Vercel + optional GitHub Pages)

The **API and Supabase integration run on Vercel.** The frontend can be hosted on Vercel (recommended) or GitHub Pages.

**Vercel (full stack):**
1. Connect this repo to Vercel and deploy. Vercel will serve both the static site and the `api/` serverless functions.
2. Set `CONFIG.API_BASE` in `app.js` to your Vercel URL (e.g. `https://your-project.vercel.app`). Redeploy after changing it.
3. Ensure Supabase is connected (Storage → Create Supabase) and env vars are set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INSTRUCTOR_PASSWORD`).

**GitHub Pages (frontend only):**
1. Push the repo and enable GitHub Pages in the repo settings.
2. Set `CONFIG.API_BASE` in `app.js` to your **Vercel** deployment URL (where the API lives), not the GitHub Pages URL.
3. Deploy the **same** repo to Vercel so the `api/` routes and Supabase integration are active.
4. Your site will be at `https://yourusername.github.io/motorcycle-training-booking/` and will call the Vercel API for slots and bookings.

## File Structure

```
motorcycle-training-booking/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── app.js                  # Frontend logic (talks to Vercel API, not localStorage)
├── package.json            # Dependencies (incl. @supabase/supabase-js)
├── vercel.json             # Vercel config
├── SUPABASE_SETUP.md       # Step-by-step Supabase + Vercel setup
├── api/                    # Vercel serverless (Supabase + calendar)
│   ├── slots.js            # GET/POST/DELETE slots
│   ├── bookings.js         # POST create booking
│   ├── instructor/
│   │   └── verify.js       # POST verify instructor password
│   └── create-calendar-event.js  # Google Calendar event creation
└── README.md               # This file
```

## Usage

### For Customers:
1. Select a session type (Training Session, MST, or Class 6)
2. Choose an available date and time from the dropdown
3. Enter duration, personal details, and optional notes
4. Review the total price
5. Click "Book Appointment"
6. The system will create a calendar event and send an email to the instructor

### For Instructors:
1. Click "Instructor Panel" button
2. Enter the instructor password when prompted
3. Once authenticated, you can:
   - Add available time slots (date, time, duration, and session type)
   - View all slots (booked slots are marked in red)
   - Remove available slots
4. Use the "Back to Booking Page" button to return to the customer view
5. **Note:** You'll need to re-enter the password if you close the browser (authentication persists only during the session)

## Important Notes

- **Data Storage:** Slots and bookings are in **Supabase** (Postgres), connected via Vercel. No localStorage. Same data for all users and devices.
- **Email Limits:** EmailJS free tier allows 200 emails/month. For higher volumes, upgrade or use a different service.
- **Calendar:** Google Calendar events are created via a Vercel serverless function (service account). See SETUP_SERVICE_ACCOUNT.md if needed.
- **Instructor Email:** Set in `app.js` (`CONFIG.INSTRUCTOR_EMAIL`).

## Customization

- **Instructor Email:** Change `INSTRUCTOR_EMAIL` in `app.js`
- **Instructor Password:** Set in **Vercel** → Settings → Environment Variables → `INSTRUCTOR_PASSWORD`. (A fallback in `app.js` exists only for local dev when the API is not used.)
- **API base URL:** Set `CONFIG.API_BASE` in `app.js` to your Vercel deployment URL (no trailing slash).
- **Pricing:** Modify `PRICING` object in `app.js`
- **Styling:** Edit `styles.css` to match your brand
- **Session Types:** Update `SESSION_NAMES` in `app.js`

## Security Notes

- **Instructor Password:** Stored only in Vercel env as `INSTRUCTOR_PASSWORD`. Checked by `/api/instructor/verify` and by `/api/slots` for add/remove. **Do not** rely on the fallback in `app.js` for production.
- **Session:** Instructor “logged in” state is in sessionStorage; they must re-enter the password after closing the browser. The password itself is never stored in the frontend.
- **Backend:** Slots and bookings are validated and written by Vercel serverless APIs using Supabase (service role key in env). Customers cannot add/remove slots.

## Troubleshooting

- **Emails not sending:** Check EmailJS configuration and template variables in `app.js`.
- **Calendar events not creating:** See SETUP_SERVICE_ACCOUNT.md; ensure Vercel env has `SERVICE_ACCOUNT_EMAIL`, `SERVICE_ACCOUNT_PRIVATE_KEY`, `INSTRUCTOR_CALENDAR_EMAIL`.
- **Slots not showing / “Failed to load slots”:** Ensure Supabase is connected in Vercel Storage, env has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and `CONFIG.API_BASE` in `app.js` matches your Vercel URL. Run the SQL from SUPABASE_SETUP.md to create tables.
- **Instructor login rejected:** Set `INSTRUCTOR_PASSWORD` in Vercel → Settings → Environment Variables.

## License

Free to use and modify for your needs.
