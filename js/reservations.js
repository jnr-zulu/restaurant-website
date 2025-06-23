/**
 * Restaurant Reservation System
 * This script handles the restaurant's online reservation system,
 * including form validation, date/time selection, and confirmation display.
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeReservationForm();
    setupDateTimePickers();
});

/**
 * Validates all form fields for the reservation form
 * @param {string} formId - The HTML ID of the form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(formId) {
    // Get form elements
    const form = document.getElementById(formId);
    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const date = form.querySelector('[name="date"]').value;
    const time = form.querySelector('[name="time"]').value;
    const guests = form.querySelector('[name="guests"]').value;
    
    // Check for empty required fields
    if (!name || !email || !phone || !date || !time || !guests) {
        alert('Please fill out all required fields');
        return false;
    }
    
    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Phone number format validation
    const phonePattern = /^[0-9+\-\s()]{10,15}$/;
    if (!phonePattern.test(phone)) {
        alert('Please enter a valid phone number');
        return false;
    }
    
    // Guest count validation (1-20 people)
    const guestNum = parseInt(guests);
    if (isNaN(guestNum) || guestNum < 1 || guestNum > 20) {
        alert('Please enter a valid number of guests (1-20)');
        return false;
    }
    
    return true;
}

/**
 * Sets up the reservation form submission handler
 */
function initializeReservationForm() {
    const reservationForm = document.getElementById('reservation-form');
    
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm('reservation-form')) {
                return;
            }
            
            // Collect form data into an object
            const formData = new FormData(this);
            const reservationData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                date: formData.get('date'),
                time: formData.get('time'),
                guests: formData.get('guests'),
                occasion: formData.get('occasion'),
                requests: formData.get('special-requests'),
                id: Date.now(),
                status: 'pending'
            };
            
            // Store reservation data
            saveReservation(reservationData);
            
            // Display confirmation and reset form
            showReservationConfirmation(reservationData);
            this.reset();
        });
    }
}

/**
 * Saves the reservation to localStorage
 * @param {Object} reservationData - The reservation data to save
 */
function saveReservation(reservationData) {
    // In a production app, this would be an API call
    let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    reservations.push(reservationData);
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

/**
 * Configures the date and time input fields with appropriate constraints
 */
function setupDateTimePickers() {
    const dateInput = document.getElementById('reservation-date');
    const timeInput = document.getElementById('reservation-time');
    
    if (dateInput) {
        // Set date range (today to 3 months from now)
        const today = new Date();
        dateInput.setAttribute('min', today.toISOString().split('T')[0]);
        
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    }
    
    if (timeInput) {
        populateTimeSlots(timeInput);
    }
}

/**
 * Fills the time dropdown with available reservation slots
 * @param {HTMLElement} timeInput - The time select element
 */
function populateTimeSlots(timeInput) {
    timeInput.innerHTML = '';
    
    // Restaurant hours (8:00 AM - 10:00 PM)
    const openingHour = 8;
    const closingHour = 22;
    
    // Create 30-minute interval time slots
    for (let hour = openingHour; hour < closingHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinute = minute.toString().padStart(2, '0');
            const timeValue = `${formattedHour}:${formattedMinute}`;
            
            // Format for display (12-hour format)
            let displayHour = hour % 12 || 12; // Convert 0 to 12
            let period = hour >= 12 ? 'PM' : 'AM';
            const displayTime = `${displayHour}:${formattedMinute} ${period}`;
            
            const option = document.createElement('option');
            option.value = timeValue;
            option.textContent = displayTime;
            timeInput.appendChild(option);
        }
    }
}

/**
 * Displays a confirmation message after successful reservation
 * @param {Object} reservationData - The submitted reservation data
 */
function showReservationConfirmation(reservationData) {
    const reservationForm = document.getElementById('reservation-form');
    const formContainer = reservationForm.parentElement;
    
    // Create confirmation element
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'reservation-confirmation';
    
    // Format date and time for readable display
    const dateObj = new Date(reservationData.date + 'T' + reservationData.time);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    
    // Build confirmation message HTML
    confirmationDiv.innerHTML = `
        <div class="confirmation-icon">✓</div>
        <h2>Reservation Confirmed!</h2>
        <p>Thank you, ${reservationData.name}! Your reservation has been received.</p>
        <div class="reservation-details">
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Party Size:</strong> ${reservationData.guests} guests</p>
            ${reservationData.occasion ? `<p><strong>Occasion:</strong> ${reservationData.occasion}</p>` : ''}
        </div>
        <p>A confirmation email has been sent to ${reservationData.email}.</p>
        <p>If you need to make any changes to your reservation, please call us at 0822166658.</p>
        <button class="btn primary-btn" id="new-reservation-btn">Make Another Reservation</button>
    `;
    
    // Hide form and display confirmation
    reservationForm.style.display = 'none';
    formContainer.appendChild(confirmationDiv);
    
    // Add event listener for "Make Another Reservation" button
    const newReservationBtn = document.getElementById('new-reservation-btn');
    if (newReservationBtn) {
        newReservationBtn.addEventListener('click', function() {
            confirmationDiv.remove();
            reservationForm.style.display = 'block';
        });
    }
}
