// Vercel Serverless Function - Creates Google Calendar Events using Service Account
// This file should be deployed to: /api/create-calendar-event.js

const { google } = require('googleapis');

// Service Account Configuration
// IMPORTANT: Store these as environment variables in Vercel:
// - SERVICE_ACCOUNT_EMAIL (from service account JSON)
// - SERVICE_ACCOUNT_PRIVATE_KEY (from service account JSON, replace \n with actual newlines)
// - INSTRUCTOR_CALENDAR_EMAIL (Ayushsutariya1310@gmail.com)

const VANCOUVER_TIMEZONE = 'America/Vancouver';

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { title, start, duration, description } = req.body;

        if (!title || !start || !duration) {
            return res.status(400).json({ error: 'Missing required fields: title, start, duration' });
        }

        // Get service account credentials from environment variables
        const serviceAccountEmail = process.env.SERVICE_ACCOUNT_EMAIL;
        const serviceAccountPrivateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const instructorCalendarEmail = process.env.INSTRUCTOR_CALENDAR_EMAIL || 'Ayushsutariya1310@gmail.com';

        if (!serviceAccountEmail || !serviceAccountPrivateKey) {
            console.error('Service account credentials not configured');
            return res.status(500).json({ 
                error: 'Server configuration error: Service account not set up',
                details: 'Missing SERVICE_ACCOUNT_EMAIL or SERVICE_ACCOUNT_PRIVATE_KEY environment variables'
            });
        }

        console.log('Service account email:', serviceAccountEmail);
        console.log('Instructor calendar email:', instructorCalendarEmail);

        // Create JWT client for service account
        const auth = new google.auth.JWT({
            email: serviceAccountEmail,
            key: serviceAccountPrivateKey,
            scopes: ['https://www.googleapis.com/auth/calendar.events']
        });

        // Initialize Calendar API
        const calendar = google.calendar({ version: 'v3', auth });

        // Parse start time
        const startDateTime = new Date(start);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

        // Create calendar event
        // NOTE: Service accounts cannot invite attendees without Domain-Wide Delegation
        // Since this is a personal Gmail account, we create the event without attendees
        // The event will appear in the instructor's calendar (since it's shared with service account)
        const event = {
            summary: title,
            description: description || '',
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: VANCOUVER_TIMEZONE
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: VANCOUVER_TIMEZONE
            }
            // Removed attendees - service accounts can't invite without domain-wide delegation
            // The event will still appear in the instructor's calendar since it's shared
        };

        // Insert event into the instructor's calendar
        // IMPORTANT: The calendar must be shared with the service account email
        // Since the calendar is shared, we can use 'primary' to access it
        // Note: sendUpdates is removed since we can't invite attendees with service account
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        return res.status(200).json({
            success: true,
            eventId: response.data.id,
            htmlLink: response.data.htmlLink
        });

    } catch (error) {
        console.error('Calendar event creation error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
        
        // Provide more detailed error information
        let errorMessage = error.message || 'Failed to create calendar event';
        if (error.response?.data) {
            errorMessage += `: ${JSON.stringify(error.response.data)}`;
        }
        
        return res.status(500).json({
            error: 'Failed to create calendar event',
            message: errorMessage,
            details: error.response?.data || null
        });
    }
}
