document.addEventListener('DOMContentLoaded', function() {
    // Initialize reservation form
    initializeReservationForm();
    
    // Setup date and time pickers
    setupDateTimePickers();
});

function validateForm(formId) {
    // Get form elements
    const form = document.getElementById(formId);
    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const date = form.querySelector('[name="date"]').value;
    const time = form.querySelector('[name="time"]').value;
    const guests = form.querySelector('[name="guests"]').value;
    
    // Basic validation
    if (!name || !email || !phone || !date || !time || !guests) {
        alert('Please fill out all required fields');
        return false;
    }
    
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Phone validation (basic)
    const phonePattern = /^[0-9+\-\s()]{10,15}$/;
    if (!phonePattern.test(phone)) {
        alert('Please enter a valid phone number');
        return false;
    }
    
    // Guest number validation
    const guestNum = parseInt(guests);
    if (isNaN(guestNum) || guestNum < 1 || guestNum > 20) {
        alert('Please enter a valid number of guests (1-20)');
        return false;
    }
    
    return true;
}

function initializeReservationForm() {
    const reservationForm = document.getElementById('reservation-form');
    
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm('reservation-form')) {
                return;
            }
            
            // Get form data
            const formData = new FormData(this);
            const reservationData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                date: formData.get('date'),
                time: formData.get('time'),
                guests: formData.get('guests'),
                occasion: formData.get('occasion'),
                requests: formData.get('special-requests')
            };
            
            // In a real app, this would be sent to the server via AJAX
            // For demo purposes, we'll just store it in localStorage
            
            // Get existing reservations
            let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
            
            // Add new reservation with a unique ID
            reservationData.id = Date.now();
            reservationData.status = 'pending';
            reservations.push(reservationData);
            
            // Save to localStorage
            localStorage.setItem('reservations', JSON.stringify(reservations));
            
            // Show success message
            showReservationConfirmation(reservationData);
            
            // Reset form
            this.reset();
        });
    }
}

function setupDateTimePickers() {
    const dateInput = document.getElementById('reservation-date');
    const timeInput = document.getElementById('reservation-time');
    
    if (dateInput) {
        // Set min date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        dateInput.setAttribute('min', formattedDate);
        
        // Set max date to 3 months from now
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        const formattedMaxDate = maxDate.toISOString().split('T')[0];
        dateInput.setAttribute('max', formattedMaxDate);
    }
    
    if (timeInput) {
        // Set available time slots
        timeInput.innerHTML = '';
        
        // Restaurant hours: 8 AM - 10 PM
        const openingHour = 8;
        const closingHour = 22;
        
        // Create time slots at 30-minute intervals
        for (let hour = openingHour; hour < closingHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const formattedHour = hour.toString().padStart(2, '0');
                const formattedMinute = minute.toString().padStart(2, '0');
                const timeValue = `${formattedHour}:${formattedMinute}`;
                
                // Convert to 12-hour format for display
                let displayHour = hour;
                let period = 'AM';
                
                if (hour >= 12) {
                    period = 'PM';
                    if (hour > 12) {
                        displayHour = hour - 12;
                    }
                }
                
                if (displayHour === 0) {
                    displayHour = 12;
                }
                
                const displayTime = `${displayHour}:${formattedMinute} ${period}`;
                
                const option = document.createElement('option');
                option.value = timeValue;
                option.textContent = displayTime;
                timeInput.appendChild(option);
            }
        }
    }
}

function showReservationConfirmation(reservationData) {
    // Create a confirmation message
    const reservationForm = document.getElementById('reservation-form');
    const formContainer = reservationForm.parentElement;
    
    // Create confirmation element
    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'reservation-confirmation';
    
    // Format date and time for display
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
    
    // Build confirmation message
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
    
    // Hide form and show confirmation
    reservationForm.style.display = 'none';
    formContainer.appendChild(confirmationDiv);
    
    // Add event listener to "Make Another Reservation" button
    const newReservationBtn = document.getElementById('new-reservation-btn');
    if (newReservationBtn) {
        newReservationBtn.addEventListener('click', function() {
            // Remove confirmation and show form again
            confirmationDiv.remove();
            reservationForm.style.display = 'block';
        });
    }
}