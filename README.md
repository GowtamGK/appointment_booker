# Motorcycle Training Booking System

A modern, responsive appointment booking system for motorcycle driving training sessions. This system allows customers to book training sessions and enables instructors to manage available time slots.

## Features

- **Three Session Types:**
  - Training Session: $60 CAD/hour
  - MST: $75 CAD/hour
  - Class 6: $100 CAD/hour

- **Customer Features:**
  - View and select available time slots
  - Book appointments with customer details
  - Automatic price calculation
  - Email notifications to instructor

- **Instructor Features:**
  - Password-protected instructor panel
  - Add available time slots for future dates
  - Remove available slots
  - View all slots (booked and available)
  - Warning banner for unauthorized users

- **Automation:**
  - Automatic calendar event creation (Google Calendar)
  - Email notifications to instructor (EmailJS)

## Setup Instructions

### 1. EmailJS Setup (Free Email Service)

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

### 2. Google Calendar API Setup

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

### 3. Deploy to GitHub Pages

1. **Create a GitHub Repository:**
   - Create a new repository on GitHub
   - Name it something like `motorcycle-training-booking`

2. **Upload Files:**
   - Upload all files from this directory to your repository
   - Make sure `index.html` is in the root of the repository

3. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages"
   - Select the branch (usually `main` or `master`)
   - Select the folder (usually `/root`)
   - Click "Save"

4. **Update OAuth Redirect URI:**
   - After deploying, update your Google OAuth credentials
   - Add your GitHub Pages URL to authorized JavaScript origins and redirect URIs

5. **Access Your Site:**
   - Your site will be available at: `https://yourusername.github.io/motorcycle-training-booking/`

## File Structure

```
motorcycle-training-booking/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── app.js             # JavaScript application logic
└── README.md          # This file
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

- **Data Storage:** Currently uses browser localStorage. For production, consider using a backend database.
- **Email Limits:** EmailJS free tier allows 200 emails/month. For higher volumes, upgrade or use a different service.
- **Calendar Authorization:** Users need to authorize Google Calendar access on first use.
- **Instructor Email:** Currently set to `Aps20@sfu.ca`. Update in `app.js` if needed.

## Customization

- **Instructor Email:** Change `INSTRUCTOR_EMAIL` in `app.js`
- **Instructor Password:** Change `INSTRUCTOR_PASSWORD` in `app.js` (default: `instructor2024`)
- **Pricing:** Modify `PRICING` object in `app.js`
- **Styling:** Edit `styles.css` to match your brand
- **Session Types:** Update `SESSION_NAMES` in `app.js`

## Security Notes

- **Instructor Panel Password:** The instructor panel is protected by a password. The default password is `instructor2024`. **IMPORTANT:** Change this password in `app.js` before deploying to production.
- **Password Storage:** Authentication is stored in sessionStorage, which means it persists only during the browser session. Users will need to re-authenticate after closing the browser.
- **Client-Side Security:** This is a client-side application. For production use with sensitive data, consider implementing server-side authentication and authorization.

## Troubleshooting

- **Emails not sending:** Check EmailJS configuration and template variables
- **Calendar events not creating:** Ensure Google Calendar API is enabled and OAuth is configured correctly
- **Slots not showing:** Check browser console for errors and ensure slots are added with future dates

## License

Free to use and modify for your needs.
