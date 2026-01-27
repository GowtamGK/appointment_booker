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
const CALENDAR_CONFIG = {
    CLIENT_ID: '113324119776-h2jd7a2evfdfe7jjin1jlf1sfs4flk28.apps.googleusercontent.com', // ✅ Your OAuth Client ID
    API_KEY: 'AIzaSyD7zRXAqp521duUJNxQvvujo7CESK82z9M', // ✅ Your API Key
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    SCOPES: 'https://www.googleapis.com/auth/calendar.events'
};

// Initialize EmailJS (only if Public Key is configured)
if (EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY' && EMAILJS_CONFIG.PUBLIC_KEY) {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

// State
let availableSlots = JSON.parse(localStorage.getItem('availableSlots')) || [];
let isAuthorized = false;
let isInstructorAuthenticated = sessionStorage.getItem('instructorAuthenticated') === 'true';

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
const totalPriceSpan = document.getElementById('totalPrice');
const bookingStatus = document.getElementById('bookingStatus');
const calendarAuth = document.getElementById('calendarAuth');
const authorizeBtn = document.getElementById('authorizeBtn');

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadAvailableSlots();
    updatePriceDisplay();
    checkCalendarAuth();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    slotDateInput.min = today;
    bookingDateInput.min = today;
});

// Event Listeners
function setupEventListeners() {
    // Instructor Panel Toggle - Show password modal first
    toggleInstructorBtn.addEventListener('click', () => {
        if (isInstructorAuthenticated) {
            // Already authenticated, toggle panels
            instructorPanel.classList.toggle('hidden');
            bookingPanel.classList.toggle('hidden');
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
    
    if (!sessionType || !selectedDate) {
        return;
    }

    // Filter slots by date only (no session type filter - slots are universal)
    const filteredSlots = availableSlots.filter(slot => {
        return slot.date === selectedDate && !slot.booked;
    });

    if (filteredSlots.length === 0) {
        timeSlotGroup.style.display = 'none';
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
}

// Handle Instructor Date Change - Generate time slots
function handleInstructorDateChange() {
    const date = slotDateInput.value;
    
    if (!date) {
        timeSlotsContainer.style.display = 'none';
        addSlotsBtn.style.display = 'none';
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

    // Remove existing slots for this date (that aren't booked)
    availableSlots = availableSlots.filter(slot => !(slot.date === date && !slot.booked));

    // Add new slots for selected times
    selectedCheckboxes.forEach(checkbox => {
        const time = checkbox.value;
        const slot = {
            id: `${date}_${time}_${Date.now()}`,
            date,
            time,
            duration: 1, // Always 1 hour
            booked: false
        };
        availableSlots.push(slot);
    });

    saveAvailableSlots();
    loadAvailableSlots();
    handleInstructorDateChange(); // Refresh the grid
    
    showInstructorStatus(`${selectedCheckboxes.length} time slot(s) added successfully!`, 'success');
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
    
    if (availableSlots.length === 0) {
        availableSlotsDiv.innerHTML = '<p>No available slots. Add some using the form above.</p>';
        return;
    }

    const sortedSlots = [...availableSlots].sort((a, b) => {
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

        // Create calendar event
        let calendarEventId = null;
        if (isAuthorized) {
            try {
                calendarEventId = await createCalendarEvent({
                    title: `${CONFIG.SESSION_NAMES[sessionType]} - ${customerName}`,
                    start: new Date(selectedSlot.date + 'T' + selectedSlot.time),
                    duration: duration,
                    description: `Customer: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\nPrice: $${totalPrice} CAD\n${notes ? 'Notes: ' + notes : ''}`
                });
            } catch (error) {
                console.error('Calendar event creation failed:', error);
                // Continue even if calendar fails
            }
        }

        // Send email
        try {
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
                calendarEventId: calendarEventId
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            showStatus('Booking created but email failed to send. Please contact the instructor directly.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Appointment';
            return;
        }

        // Success
        showStatus('Appointment booked successfully! A confirmation email has been sent to the instructor.', 'success');
        bookingForm.reset();
        timeSlotGroup.style.display = 'none';
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

// Send Email using EmailJS
async function sendEmail(bookingData) {
    if (EMAILJS_CONFIG.TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        throw new Error('EmailJS not fully configured. Please set up Template ID and Public Key.');
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

    return emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
    );
}

// Google Calendar Functions
function checkCalendarAuth() {
    if (CALENDAR_CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID') {
        calendarAuth.classList.remove('hidden');
        return;
    }

    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: CALENDAR_CONFIG.API_KEY,
            clientId: CALENDAR_CONFIG.CLIENT_ID,
            discoveryDocs: CALENDAR_CONFIG.DISCOVERY_DOCS,
            scope: CALENDAR_CONFIG.SCOPES
        }).then(() => {
            const authInstance = gapi.auth2.getAuthInstance();
            isAuthorized = authInstance.isSignedIn.get();
            
            if (!isAuthorized) {
                calendarAuth.classList.remove('hidden');
            }
        });
    });
}

function handleAuthorizeClick() {
    if (CALENDAR_CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID') {
        showStatus('Google Calendar API not configured. Please set up OAuth credentials.', 'error');
        return;
    }

    gapi.auth2.getAuthInstance().signIn().then(() => {
        isAuthorized = true;
        calendarAuth.classList.add('hidden');
        showStatus('Google Calendar authorized successfully!', 'success');
    }).catch(error => {
        console.error('Authorization error:', error);
        showStatus('Failed to authorize Google Calendar.', 'error');
    });
}

async function createCalendarEvent(eventData) {
    if (!isAuthorized) {
        throw new Error('Not authorized');
    }

    const startDateTime = new Date(eventData.start);
    const endDateTime = new Date(startDateTime.getTime() + eventData.duration * 60 * 60 * 1000);

    const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: [
            { email: CONFIG.INSTRUCTOR_EMAIL }
        ]
    };

    const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
    });

    return response.result.id;
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
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
