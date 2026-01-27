# Setup Guide: Google Calendar Service Account (No OAuth Needed!)

This guide will help you set up automatic calendar event creation **without requiring any user authorization**. Once set up, calendar events will be created automatically for every booking - no re-authorization needed!

## Step 1: Create Service Account in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **Service account**
5. Name it: `motorcycle-booking-calendar`
6. Click **CREATE AND CONTINUE**
7. Skip the role assignment (click **CONTINUE**)
8. Click **DONE**

## Step 2: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format
5. Click **CREATE**
6. **SAVE THE DOWNLOADED JSON FILE** - you'll need it in Step 4

## Step 3: Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **ENABLE**

## Step 4: Share Calendar with Service Account

1. Open the JSON file you downloaded in Step 2
2. Find the `client_email` field (looks like: `motorcycle-booking-calendar@your-project.iam.gserviceaccount.com`)
3. Copy that email address
4. Go to [Google Calendar](https://calendar.google.com/)
5. Make sure you're signed in as **Ayushsutariya1310@gmail.com**
6. Click the **⚙️ Settings** icon (top right) → **Settings**
7. Click **Settings for my calendars** → Select your main calendar
8. Scroll down to **Share with specific people**
9. Click **+ Add people**
10. Paste the service account email address
11. Set permission to **Make changes to events**
12. Click **Send**

## Step 5: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. In your project folder, run:
   ```bash
   vercel
   ```

3. Follow the prompts to deploy

4. After deployment, note your deployment URL (e.g., `https://your-app.vercel.app`)

### Option B: Using Vercel Website

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New Project**
3. Import your GitHub repository
4. Vercel will auto-detect the project and deploy

## Step 6: Set Environment Variables in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add these three variables:

   **Variable 1:**
   - Name: `SERVICE_ACCOUNT_EMAIL`
   - Value: The `client_email` from your JSON file (e.g., `motorcycle-booking-calendar@your-project.iam.gserviceaccount.com`)

   **Variable 2:**
   - Name: `SERVICE_ACCOUNT_PRIVATE_KEY`
   - Value: The `private_key` from your JSON file (copy the entire value, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

   **Variable 3:**
   - Name: `INSTRUCTOR_CALENDAR_EMAIL`
   - Value: `Ayushsutariya1310@gmail.com`

3. Click **Save** for each variable

## Step 7: Update Frontend Code

1. Open `app.js`
2. Find the `CALENDAR_CONFIG` section (around line 27)
3. Update `API_ENDPOINT` with your Vercel URL:
   ```javascript
   API_ENDPOINT: 'https://your-app.vercel.app/api/create-calendar-event'
   ```
   Replace `your-app.vercel.app` with your actual Vercel deployment URL

4. Save and deploy your frontend (GitHub Pages or wherever you host it)

## Step 8: Test It!

1. Make a test booking on your website
2. Check the instructor's Google Calendar - the event should appear automatically!
3. No authorization needed - it just works! 🎉

## Troubleshooting

### Events not appearing?
- Check that the calendar is shared with the service account email (Step 4)
- Verify environment variables are set correctly in Vercel
- Check Vercel function logs for errors

### Getting 500 errors?
- Make sure Google Calendar API is enabled (Step 3)
- Verify the service account JSON key is correct
- Check that the private key environment variable includes the full key with `\n` characters

### Need help?
- Check Vercel function logs: Vercel Dashboard → Your Project → Functions → View Logs
- Check browser console for frontend errors

## Security Notes

- ✅ The service account key is stored securely in Vercel (not in your code)
- ✅ Never commit the JSON key file to GitHub
- ✅ The `.gitignore` file already excludes service account keys
- ✅ Only the service account email needs calendar access (not the full key)

## That's It!

Once set up, calendar events will be created automatically for every booking - no user interaction needed, ever! 🚀
