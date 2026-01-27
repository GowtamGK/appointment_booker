// Configuration
const CONFIG = {
    INSTRUCTOR_EMAIL: 'Ayushsutariya1310@gmail.com',
    INSTRUCTOR_PASSWORD: 'instructor2024', // Change this to your desired password
    PRICING: {
        training: 60,
        mst: 75,
        class6: 100
    },
    SESSION_NAMES: {
        training: 'Training Session',
        mst: 'MST',
        class6: 'Class 6'
    }
};

// EmailJS Configuration (User needs to set this up)
// Replace with your EmailJS service ID, template ID, and public key
// Your Service ID: service_wm6smmq (from EmailJS dashboard)
const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_wm6smmq', // ✅ Your Service ID
    TEMPLATE_ID: 'template_ykvj57q', // ✅ Your Template ID
    PUBLIC_KEY: 'wJ3HHhNIy7ZCfxpr1' // ✅ Your Public Key
};

// Google Calendar API Configuration
// Using serverless function approach - no OAuth needed!
const CALENDAR_CONFIG = {
    API_ENDPOINT: 'https://appointment-booker-seven.vercel.app/api/create-calendar-event', // ✅ Your Vercel deployment URL
    // Legacy OAuth config (kept for fallback, but not needed with service account)
    CLIENT_ID: '113324119776-h2jd7a2evfdfe7jjin1jlf1sfs4flk28.apps.googleusercontent.com',
    API_KEY: 'AIzaSyD7zRXAqp521duUJNxQvvujo7CESK82z9M',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    SCOPES: 'https://www.googleapis.com/auth/calendar.events'
};

// Initialize EmailJS v4 (only if Public Key is configured)
function initializeEmailJS() {
    if (EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' && EMAILJS_CONFIG.PUBLIC_KEY) {
        if (typeof emailjs !== 'undefined') {
            try {
                // EmailJS v4 uses object format for init
                emailjs.init({
                    publicKey: EMAILJS_CONFIG.PUBLIC_KEY
                });
                console.log('EmailJS v4 initialized successfully with public key:', EMAILJS_CONFIG.PUBLIC_KEY.substring(0, 10) + '...');
            } catch (error) {
                console.error('EmailJS initialization error:', error);
            }
        } else {
            console.warn('EmailJS SDK not loaded yet, retrying...');
            setTimeout(initializeEmailJS, 500);
        }
    } else {
        console.warn('EmailJS Public Key not configured');
    }
}

// Wait for EmailJS script to load - try multiple times
let emailjsRetryCount = 0;
function waitForEmailJS() {
    if (typeof emailjs !== 'undefined') {
        initializeEmailJS();
    } else if (emailjsRetryCount < 10) {
        emailjsRetryCount++;
        setTimeout(waitForEmailJS, 300);
    } else {
        console.error('EmailJS SDK failed to load after multiple attempts');
    }
}

// Start waiting for EmailJS to load
waitForEmailJS();

// State
let availableSlots = JSON.parse(localStorage.getItem('availableSlots')) || [];
let isAuthorized = false;
let isInstructorAuthenticated = sessionStorage.getItem('instructorAuthenticated') === 'true';
let tokenClient = null;
let accessToken = null;

// DOM Elements
const toggleInstructorBtn = document.getElementById('toggleInstructor');
const instructorPanel = document.getElementById('instructorPanel');
const bookingPanel = document.getElementById('bookingPanel');
const bookingForm = document.getElementById('bookingForm');
const sessionCards = document.querySelectorAll('.session-card');
const sessionTypeSelect = document.getElementById('sessionType');
const bookingDateInput = document.getElementById('bookingDate');
const timeSlotSelect = document.getElementById('timeSlot');
const timeSlotGroup = document.getElementById('timeSlotGroup');
const noSlotsMessage = document.getElementById('noSlotsMessage');
const totalPriceSpan = document.getElementById('totalPrice');
const bookingStatus = document.getElementById('bookingStatus');
const calendarAuth = document.getElementById('calendarAuth');
const authorizeBtn = document.getElementById('authorizeBtn');
const calendarAuthStatus = document.getElementById('calendarAuthStatus');

// Instructor Panel Elements
const addSlotsBtn = document.getElementById('addSlots');
const slotDateInput = document.getElementById('slotDate');
const timeSlotsContainer = document.getElementById('timeSlotsContainer');
const timeSlotsGrid = document.getElementById('timeSlotsGrid');
const availableSlotsDiv = document.getElementById('availableSlots');
const instructorStatus = document.getElementById('instructorStatus');

// Password Modal Elements
const passwordModal = document.getElementById('passwordModal');
const instructorPasswordInput = document.getElementById('instructorPassword');
const submitPasswordBtn = document.getElementById('submitPassword');
const cancelPasswordBtn = document.getElementById('cancelPassword');
const passwordError = document.getElementById('passwordError');
const backToHomeBtn = document.getElementById('backToHome');

// Success Modal Elements
const successModal = document.getElementById('successModal');
const closeSuccessModal = document.getElementById('closeSuccessModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadAvailableSlots();
    updatePriceDisplay();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    slotDateInput.min = today;
    bookingDateInput.min = today;
    
    // Wait a bit for Google Identity Services to load before checking auth
    setTimeout(() => {
        initializeGoogleCalendar();
    }, 500);
});

// Event Listeners
function setupEventListeners() {
    // Instructor Panel Toggle - Show password modal first
    toggleInstructorBtn.addEventListener('click', () => {
        if (isInstructorAuthenticated) {
            // Already authenticated, toggle panels
            instructorPanel.classList.toggle('hidden');
            bookingPanel.classList.toggle('hidden');
            // Refresh calendar status when showing instructor panel
            if (!instructorPanel.classList.contains('hidden')) {
                refreshCalendarAuthStatus();
            }
        } else {
            // Show password modal
            showPasswordModal();
        }
    });

    // Password Modal Events
    submitPasswordBtn.addEventListener('click', handlePasswordSubmit);
    cancelPasswordBtn.addEventListener('click', hidePasswordModal);
    instructorPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePasswordSubmit();
        }
    });

    // Back to Home Button
    backToHomeBtn.addEventListener('click', () => {
        instructorPanel.classList.add('hidden');
        bookingPanel.classList.remove('hidden');
    });

    // Close modal when clicking outside
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            hidePasswordModal();
        }
    });

    // Session Card Selection
    sessionCards.forEach(card => {
        card.addEventListener('click', () => {
            sessionCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const type = card.dataset.type;
            sessionTypeSelect.value = type;
            updatePriceDisplay();
            updateTimeSlots();
        });
    });

    // Session Type Select Change
    sessionTypeSelect.addEventListener('change', () => {
        updatePriceDisplay();
        updateTimeSlots();
        sessionCards.forEach(c => {
            if (c.dataset.type === sessionTypeSelect.value) {
                c.classList.add('selected');
            } else {
                c.classList.remove('selected');
            }
        });
    });

    // Booking Date Change
    bookingDateInput.addEventListener('change', () => {
        updateTimeSlots();
        updatePriceDisplay();
    });

    // Time Slot Change
    timeSlotSelect.addEventListener('change', () => {
        updatePriceDisplay();
    });

    // Booking Form Submit
    bookingForm.addEventListener('submit', handleBookingSubmit);

    // Instructor Date Change - Show time slots
    slotDateInput.addEventListener('change', handleInstructorDateChange);
    
    // Add Slots
    addSlotsBtn.addEventListener('click', handleAddSlots);

    // Google Calendar Authorization
    authorizeBtn.addEventListener('click', handleAuthorizeClick);

    // Success Modal Close
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            successModal.classList.add('hidden');
        });
    }

    // Close success modal when clicking outside
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.add('hidden');
            }
        });
    }
}

// Update Price Display
function updatePriceDisplay() {
    const sessionType = sessionTypeSelect.value;
    const selectedSlotId = timeSlotSelect.value;
    
    if (sessionType && selectedSlotId && CONFIG.PRICING[sessionType]) {
        const selectedSlot = availableSlots.find(slot => slot.id === selectedSlotId);
        if (selectedSlot) {
            const total = CONFIG.PRICING[sessionType] * selectedSlot.duration;
            totalPriceSpan.textContent = `$${total}`;
        } else {
            totalPriceSpan.textContent = '$0';
        }
    } else {
        totalPriceSpan.textContent = '$0';
    }
}

// Update Time Slots based on selected date and session type
function updateTimeSlots() {
    const sessionType = sessionTypeSelect.value;
    const selectedDate = bookingDateInput.value;
    
    timeSlotSelect.innerHTML = '<option value="">Select a time slot</option>';
    timeSlotGroup.style.display = 'none';
    if (noSlotsMessage) {
        noSlotsMessage.style.display = 'none';
    }
    
    if (!sessionType || !selectedDate) {
        return;
    }

    // Filter slots by date only (no session type filter - slots are universal)
    const filteredSlots = availableSlots.filter(slot => {
        return slot.date === selectedDate && !slot.booked;
    });

    if (filteredSlots.length === 0) {
        timeSlotGroup.style.display = 'none';
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'block';
        }
        return;
    }

    filteredSlots.sort((a, b) => {
        return a.time.localeCompare(b.time);
    });

    filteredSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.id;
        const price = CONFIG.PRICING[sessionType] * slot.duration;
        option.textContent = `${formatTime(slot.time)} - ${slot.duration} hour${slot.duration > 1 ? 's' : ''} ($${price} CAD)`;
        timeSlotSelect.appendChild(option);
    });

    timeSlotGroup.style.display = 'block';
    if (noSlotsMessage) {
        noSlotsMessage.style.display = 'none';
    }
}

// Handle Instructor Date Change - Generate time slots
function handleInstructorDateChange() {
    const date = slotDateInput.value;
    
    if (!date) {
        timeSlotsContainer.style.display = 'none';
        addSlotsBtn.style.display = 'none';
        // Clear the slots display when no date is selected
        loadAvailableSlots();
        return;
    }

    const slotDateTime = new Date(date + 'T00:00:00');
    if (slotDateTime < new Date().setHours(0, 0, 0, 0)) {
        showInstructorStatus('Cannot add slots in the past', 'error');
        timeSlotsContainer.style.display = 'none';
        addSlotsBtn.style.display = 'none';
        return;
    }

    // Generate time slots from 9 AM to 9 PM (1 hour each)
    timeSlotsGrid.innerHTML = '';
    // Filter slots ONLY for the selected date
    const existingSlots = availableSlots.filter(slot => slot.date === date);
    
    for (let hour = 9; hour <= 21; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const slotId = `${date}_${timeString}`;
        const existingSlot = existingSlots.find(s => s.time === timeString);
        const isChecked = existingSlot && !existingSlot.booked;
        
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot-checkbox';
        slotDiv.innerHTML = `
            <input type="checkbox" id="${slotId}" value="${timeString}" ${isChecked ? 'checked' : ''} ${existingSlot && existingSlot.booked ? 'disabled' : ''}>
            <label for="${slotId}">${formatTime(timeString)}</label>
        `;
        timeSlotsGrid.appendChild(slotDiv);
    }

    timeSlotsContainer.style.display = 'block';
    addSlotsBtn.style.display = 'block';
    
    // Update the slots list to show only slots for this date
    loadAvailableSlots();
}

// Handle Add Slots - Create slots for selected times
function handleAddSlots() {
    const date = slotDateInput.value;
    
    if (!date) {
        showInstructorStatus('Please select a date', 'error');
        return;
    }

    const selectedCheckboxes = timeSlotsGrid.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)');
    
    if (selectedCheckboxes.length === 0) {
        showInstructorStatus('Please select at least one time slot', 'error');
        return;
    }

    // Remove existing UNBOOKED slots for this SPECIFIC date only
    availableSlots = availableSlots.filter(slot => {
        // Keep the slot if it's not for this date, OR if it's booked, OR if it's for this date but booked
        return !(slot.date === date && !slot.booked);
    });

    // Add new slots for selected times - ensure date is correctly set
    selectedCheckboxes.forEach((checkbox, index) => {
        const time = checkbox.value;
        const slot = {
            id: `${date}_${time}_${Date.now()}_${index}`, // Unique ID with timestamp and index
            date: date, // Explicitly set the date
            time: time,
            duration: 1, // Always 1 hour
            booked: false
        };
        availableSlots.push(slot);
    });

    saveAvailableSlots();
    // Refresh the grid and slots list
    handleInstructorDateChange();
    
    showInstructorStatus(`${selectedCheckboxes.length} time slot(s) added successfully for ${formatDate(date)}!`, 'success');
}

// Show status in instructor panel
function showInstructorStatus(message, type) {
    instructorStatus.textContent = message;
    instructorStatus.className = `status-message ${type}`;
    setTimeout(() => {
        instructorStatus.className = 'status-message';
    }, 5000);
}

// Load Available Slots
function loadAvailableSlots() {
    availableSlotsDiv.innerHTML = '';
    
    // If we're in instructor panel and a date is selected, only show slots for that date
    const selectedDate = slotDateInput ? slotDateInput.value : null;
    let slotsToDisplay = availableSlots;
    
    if (selectedDate && instructorPanel && !instructorPanel.classList.contains('hidden')) {
        // In instructor panel with a date selected - show only slots for that date
        slotsToDisplay = availableSlots.filter(slot => slot.date === selectedDate);
    }
    
    if (slotsToDisplay.length === 0) {
        if (selectedDate && instructorPanel && !instructorPanel.classList.contains('hidden')) {
            availableSlotsDiv.innerHTML = `<p>No slots for ${formatDate(selectedDate)}. Add slots using the form above.</p>`;
        } else {
            availableSlotsDiv.innerHTML = '<p>No available slots. Add some using the form above.</p>';
        }
        return;
    }

    const sortedSlots = [...slotsToDisplay].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA - dateB;
    });

    sortedSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot-item';
        slotDiv.innerHTML = `
            <div class="slot-item-info">
                <strong>${formatDate(slot.date)}</strong> at <strong>${formatTime(slot.time)}</strong> - 
                ${slot.duration} hour${slot.duration > 1 ? 's' : ''} 
                ${slot.booked ? '<span style="color: #1a1a1a; font-weight: 600;">(Booked)</span>' : ''}
            </div>
            ${!slot.booked ? `<button onclick="removeSlot('${slot.id}')">Remove</button>` : ''}
        `;
        availableSlotsDiv.appendChild(slotDiv);
    });
}

// Remove Slot
function removeSlot(slotId) {
    const slotToRemove = availableSlots.find(slot => slot.id === slotId);
    availableSlots = availableSlots.filter(slot => slot.id !== slotId);
    saveAvailableSlots();
    loadAvailableSlots();
    updateTimeSlots();
    
    // Refresh instructor view if the date is currently selected
    if (slotToRemove && slotDateInput.value === slotToRemove.date) {
        handleInstructorDateChange();
    }
}

// Save Available Slots
function saveAvailableSlots() {
    localStorage.setItem('availableSlots', JSON.stringify(availableSlots));
}

// Handle Booking Submit
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const sessionType = sessionTypeSelect.value;
    const slotId = timeSlotSelect.value;
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const notes = document.getElementById('notes').value;

    if (!sessionType || !slotId) {
        showStatus('Please fill in all required fields', 'error');
        return;
    }

    const selectedSlot = availableSlots.find(slot => slot.id === slotId);
    if (!selectedSlot || selectedSlot.booked) {
        showStatus('This slot is no longer available', 'error');
        return;
    }

    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
        // Mark slot as booked
        selectedSlot.booked = true;
        saveAvailableSlots();
        updateTimeSlots();

        // Calculate total price
        const duration = selectedSlot.duration;
        const totalPrice = CONFIG.PRICING[sessionType] * duration;

        // Create calendar event using serverless function (no OAuth needed!)
        let calendarEventId = null;
        try {
            console.log('Attempting to create calendar event...');
            calendarEventId = await createCalendarEventViaAPI({
                title: `${CONFIG.SESSION_NAMES[sessionType]} - ${customerName}`,
                start: new Date(selectedSlot.date + 'T' + selectedSlot.time),
                duration: duration,
                description: `Customer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\nPrice: $${totalPrice} CAD\n${notes ? 'Notes: ' + notes : ''}`
            });
            console.log('Calendar event created successfully:', calendarEventId);
        } catch (error) {
            console.error('Calendar event creation failed:', error);
            // Continue even if calendar fails - booking is still valid
        }

        // Send email
        try {
            console.log('Attempting to send email...');
            await sendEmail({
                customerName,
                customerEmail,
                customerPhone,
                sessionType: CONFIG.SESSION_NAMES[sessionType],
                date: formatDate(selectedSlot.date),
                time: formatTime(selectedSlot.time),
                duration: duration,
                totalPrice: totalPrice,
                notes: notes || 'None',
                calendarEventId: calendarEventId || 'Not created'
            });
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Email sending failed:', error);
            console.error('Full error object:', error);
            showStatus('Booking created but email failed to send. Please contact the instructor directly.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Appointment';
            return;
        }

        // Success - Show celebration modal
        if (successModal) {
            successModal.classList.remove('hidden');
        }
        bookingForm.reset();
        timeSlotGroup.style.display = 'none';
        if (noSlotsMessage) {
            noSlotsMessage.style.display = 'none';
        }
        updatePriceDisplay();
        loadAvailableSlots();

    } catch (error) {
        console.error('Booking error:', error);
        showStatus('An error occurred. Please try again or contact the instructor directly.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Appointment';
    }
}

// Send Email using EmailJS v4
async function sendEmail(bookingData) {
    if (EMAILJS_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        throw new Error('EmailJS not fully configured. Please set up Template ID and Public Key.');
    }

    if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS SDK not loaded. Please check the script tag.');
    }

    const templateParams = {
        to_email: CONFIG.INSTRUCTOR_EMAIL,
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        session_type: bookingData.sessionType,
        date: bookingData.date,
        time: bookingData.time,
        duration: bookingData.duration,
        total_price: bookingData.totalPrice,
        notes: bookingData.notes,
        calendar_event_id: bookingData.calendarEventId || 'Not created'
    };

    try {
        // EmailJS v4 - pass publicKey in options
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams,
            {
                publicKey: EMAILJS_CONFIG.PUBLIC_KEY
            }
        );
        console.log('Email sent successfully:', response);
        return response;
    } catch (error) {
        console.error('EmailJS Error Details:', {
            status: error.status,
            text: error.text,
            message: error.message,
            serviceId: EMAILJS_CONFIG.SERVICE_ID,
            templateId: EMAILJS_CONFIG.TEMPLATE_ID,
            publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
            params: templateParams
        });
        const errorMessage = error.text || error.message || 'Unknown error';
        throw new Error(`EmailJS Error (${error.status || 'N/A'}): ${errorMessage}`);
    }
}

// Google Calendar Functions - Using Google Identity Services (GIS)
function initializeGoogleCalendar() {
    if (CALENDAR_CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID' || !CALENDAR_CONFIG.CLIENT_ID) {
        updateCalendarAuthStatus('Google Calendar API not configured.', 'error');
        return;
    }

    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        console.warn('Google Identity Services not loaded yet, will retry...');
        setTimeout(initializeGoogleCalendar, 1000);
        return;
    }

    // Initialize the token client
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CALENDAR_CONFIG.CLIENT_ID,
        scope: CALENDAR_CONFIG.SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse.error) {
                console.error('Token error:', tokenResponse.error);
                updateCalendarAuthStatus('Authorization failed. Please try again.', 'error');
                return;
            }
            accessToken = tokenResponse.access_token;
            isAuthorized = true;
            // Store token for future use (persists across browser sessions)
            localStorage.setItem('google_access_token', accessToken);
            updateCalendarAuthStatus('✓ Setup complete! All booking events will now automatically be created in Ayushsutariya1310@gmail.com calendar. No further action needed.', 'success');
            // Initialize gapi client for API calls
            initializeGapiClient();
        }
    });

    // Check if we have a stored token (persists across browser sessions)
    // Don't update status on page load - wait until instructor panel is shown
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
        accessToken = storedToken;
        isAuthorized = true;
        initializeGapiClient();
    }
    // Status will be updated when instructor panel is shown via refreshCalendarAuthStatus()
}

function updateCalendarAuthStatus(message, type) {
    if (calendarAuthStatus) {
        calendarAuthStatus.textContent = message;
        calendarAuthStatus.className = `status-message ${type}`;
    }
}

// Refresh calendar auth status when instructor panel is shown
function refreshCalendarAuthStatus() {
    if (!calendarAuthStatus || !instructorPanel || instructorPanel.classList.contains('hidden')) {
        return; // Don't update if panel is hidden
    }
    
    // With service account approach, no authorization needed!
    if (CALENDAR_CONFIG.API_ENDPOINT && !CALENDAR_CONFIG.API_ENDPOINT.includes('your-app')) {
        updateCalendarAuthStatus('✓ Calendar integration active! All booking events are automatically created in Ayushsutariya1310@gmail.com calendar. No authorization needed.', 'success');
    } else {
        updateCalendarAuthStatus('⚠️ Calendar API endpoint not configured. Please set up the serverless function and update CALENDAR_CONFIG.API_ENDPOINT in app.js', 'error');
    }
}

function initializeGapiClient() {
    if (typeof gapi === 'undefined') {
        console.warn('gapi not loaded yet');
        setTimeout(initializeGapiClient, 500);
        return;
    }

    gapi.load('client', () => {
        gapi.client.init({
            apiKey: CALENDAR_CONFIG.API_KEY,
            discoveryDocs: CALENDAR_CONFIG.DISCOVERY_DOCS
        }).then(() => {
            // Set the access token for API calls
            gapi.client.setToken({ access_token: accessToken });
            console.log('Google Calendar API client initialized');
        }).catch(error => {
            console.error('Error initializing gapi client:', error);
        });
    });
}

function checkCalendarAuth() {
    // Alias for backward compatibility
    initializeGoogleCalendar();
}

function handleAuthorizeClick() {
    if (CALENDAR_CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID' || !CALENDAR_CONFIG.CLIENT_ID) {
        updateCalendarAuthStatus('Google Calendar API not configured. Please set up OAuth credentials.', 'error');
        return;
    }

    if (!tokenClient) {
        updateCalendarAuthStatus('Google Calendar not initialized. Please refresh the page.', 'error');
        return;
    }

    updateCalendarAuthStatus('Opening Google sign-in... Please sign in with Ayushsutariya1310@gmail.com to grant calendar access (one-time only).', 'info');
    
    // Request access token - this will open Google's consent screen
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// NEW: Create calendar event via serverless API (no OAuth needed!)
async function createCalendarEventViaAPI(eventData) {
    if (!CALENDAR_CONFIG.API_ENDPOINT || CALENDAR_CONFIG.API_ENDPOINT.includes('your-app')) {
        throw new Error('Calendar API endpoint not configured. Please set CALENDAR_CONFIG.API_ENDPOINT in app.js');
    }

    const response = await fetch(CALENDAR_CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: eventData.title,
            start: eventData.start.toISOString(),
            duration: eventData.duration,
            description: eventData.description
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create calendar event`);
    }

    const result = await response.json();
    return result.eventId;
}

// Legacy OAuth-based function (kept for reference, not used anymore)
async function createCalendarEvent(eventData) {
    if (!isAuthorized || !accessToken) {
        throw new Error('Not authorized');
    }

    // Ensure gapi client is initialized
    if (!gapi.client || !gapi.client.calendar) {
        await new Promise((resolve, reject) => {
            if (typeof gapi === 'undefined') {
                reject(new Error('Google API not loaded'));
                return;
            }
            gapi.load('client', () => {
                gapi.client.init({
                    apiKey: CALENDAR_CONFIG.API_KEY,
                    discoveryDocs: CALENDAR_CONFIG.DISCOVERY_DOCS
                }).then(() => {
                    gapi.client.setToken({ access_token: accessToken });
                    resolve();
                }).catch(err => {
                    reject(new Error('Failed to initialize gapi client: ' + err));
                });
            });
        });
    } else {
        // Update token if needed
        gapi.client.setToken({ access_token: accessToken });
    }

    const startDateTime = new Date(eventData.start);
    const endDateTime = new Date(startDateTime.getTime() + eventData.duration * 60 * 60 * 1000);

    const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
            dateTime: startDateTime.toISOString(),
            timeZone: VANCOUVER_TIMEZONE
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: VANCOUVER_TIMEZONE
        },
        attendees: [
            { email: CONFIG.INSTRUCTOR_EMAIL }
        ]
    };

    try {
        // Create event in the instructor's primary calendar
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        console.log('Calendar event created in instructor calendar:', response.result.id);
        return response.result.id;
    } catch (error) {
        console.error('Calendar event creation error:', error);
        if (error.status === 401) {
            accessToken = null;
            isAuthorized = false;
            localStorage.removeItem('google_access_token');
            updateCalendarAuthStatus('Authorization expired. Please authorize again in the instructor panel.', 'error');
            throw new Error('Authorization expired. Please authorize again.');
        }
        throw error;
    }
}

// Utility Functions
// Vancouver, BC timezone: America/Vancouver (PST/PDT)
const VANCOUVER_TIMEZONE = 'America/Vancouver';

function formatDate(dateString) {
    // Parse date string as local date (YYYY-MM-DD format)
    // Avoid timezone issues by parsing manually - this creates a date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed, creates local date
    // Format the date - no need for timeZone since we already parsed it as local
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function showStatus(message, type) {
    bookingStatus.textContent = message;
    bookingStatus.className = `status-message ${type}`;
    setTimeout(() => {
        bookingStatus.className = 'status-message';
    }, 5000);
}

// Password Authentication Functions
function showPasswordModal() {
    passwordModal.classList.remove('hidden');
    instructorPasswordInput.value = '';
    instructorPasswordInput.focus();
    passwordError.textContent = '';
    passwordError.className = 'status-message';
}

function hidePasswordModal() {
    passwordModal.classList.add('hidden');
    instructorPasswordInput.value = '';
    passwordError.textContent = '';
    passwordError.className = 'status-message';
}

function handlePasswordSubmit() {
    const enteredPassword = instructorPasswordInput.value;
    
    if (!enteredPassword) {
        passwordError.textContent = 'Please enter a password';
        passwordError.className = 'status-message error';
        return;
    }

    if (enteredPassword === CONFIG.INSTRUCTOR_PASSWORD) {
        // Correct password
        isInstructorAuthenticated = true;
        sessionStorage.setItem('instructorAuthenticated', 'true');
        hidePasswordModal();
        
        // Show instructor panel
        instructorPanel.classList.remove('hidden');
        bookingPanel.classList.add('hidden');
        
        // Load slots
        loadAvailableSlots();
        
        // Refresh calendar auth status
        refreshCalendarAuthStatus();
    } else {
        // Wrong password
        passwordError.textContent = 'Incorrect password. Access denied.';
        passwordError.className = 'status-message error';
        instructorPasswordInput.value = '';
        instructorPasswordInput.focus();
    }
}

// Make removeSlot available globally
window.removeSlot = removeSlot;
