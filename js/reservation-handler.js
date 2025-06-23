/**
 * js/reservation-handler.js
 * This class handles all reservation-related functionality including:
 * - Creating, retrieving, updating and canceling reservations
 * - Displaying reservation details in the UI
 * - Managing user and admin reservation actions
 * - Form validation and notification handling
 */
class ReservationHandler {
  /**
   * Initialize the reservation handler with the current user
   */
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  }

  /**
   * Create a new reservation
   * @param {Object} reservationData - Contains reservation details (date, time, party size, etc)
   * @returns {Object|false} - The created reservation or false if failed
   */
  async createReservation(reservationData) {
    try {
      // Ensure user is logged in
      if (!this.currentUser) {
        throw new Error('Please log in to make a reservation');
      }

      // Send request to create reservation
      const response = await fetch('/.netlify/functions/create-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reservationData,
          user_id: this.currentUser.user_id
        })
      });

      const result = await response.json();

      if (result.success) {
        this.showSuccess('Reservation created successfully! We will confirm your booking shortly.');
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      this.showError(error.message || 'Failed to create reservation');
      return false;
    }
  }

  /**
   * Get reservations for a specific user
   * @param {string|null} userId - Optional user ID (defaults to current user)
   * @returns {Array} - List of user reservations
   */
  async getUserReservations(userId = null) {
    try {
      const queryUserId = userId || (this.currentUser ? this.currentUser.user_id : null);
      if (!queryUserId) {
        throw new Error('User not logged in');
      }

      const response = await fetch(`/.netlify/functions/get-reservations?user_id=${queryUserId}`);
      if (!response.ok) throw new Error('Failed to fetch reservations');
      
      const reservations = await response.json();
      return reservations;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      return [];
    }
  }

  /**
   * Get all reservations (admin only)
   * @param {string|null} status - Optional status filter
   * @returns {Array} - List of all reservations
   */
  async getAllReservations(status = null) {
    try {
      let url = '/.netlify/functions/get-reservations';
      if (status) {
        url += `?status=${status}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reservations');
      
      const reservations = await response.json();
      return reservations;
    } catch (error) {
      console.error('Error fetching all reservations:', error);
      return [];
    }
  }

  /**
   * Update reservation status (admin only)
   * @param {string} reservationId - ID of the reservation to update
   * @param {string} newStatus - New status value (confirmed, cancelled, etc)
   * @returns {Object|false} - Updated reservation or false if failed
   */
  async updateReservationStatus(reservationId, newStatus) {
    try {
      const response = await fetch('/.netlify/functions/update-reservation-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status: newStatus
        })
      });

      const result = await response.json();
      if (result.success) {
        this.showSuccess('Reservation status updated successfully!');
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update reservation status');
      }
    } catch (error) {
      console.error('Error updating reservation status:', error);
      this.showError('Failed to update reservation status');
      return false;
    }
  }

  /**
   * Cancel a reservation (can be called by user or admin)
   * @param {string} reservationId - ID of the reservation to cancel
   * @returns {Object|false} - Updated reservation or false if failed
   */
  async cancelReservation(reservationId) {
    try {
      const response = await fetch('/.netlify/functions/cancel-reservation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          user_id: this.currentUser ? this.currentUser.user_id : null
        })
      });

      const result = await response.json();
      if (result.success) {
        this.showSuccess('Reservation cancelled successfully!');
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to cancel reservation');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      this.showError('Failed to cancel reservation');
      return false;
    }
  }

  /**
   * Display reservations in a specified container
   * @param {Array} reservations - List of reservation objects
   * @param {string} containerId - ID of container element
   * @param {boolean} isAdmin - Whether to show admin controls
   */
  displayReservations(reservations, containerId, isAdmin = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (reservations.length === 0) {
      container.innerHTML = '&lt;p class="text-gray-500 text-center py-8"&gt;No reservations found&lt;/p&gt;';
      return;
    }

    container.innerHTML = reservations.map(reservation =&gt; this.createReservationCard(reservation, isAdmin)).join('');
  }

  /**
   * Generate HTML for a reservation card
   * @param {Object} reservation - Reservation data
   * @param {boolean} isAdmin - Whether to include admin controls
   * @returns {string} - HTML for the reservation card
   */
  createReservationCard(reservation, isAdmin = false) {
    const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reservationTime = reservation.reservation_time.substring(0, 5); // Remove seconds

    // Define colors for different status types
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return `
      &lt;div class="reservation-card bg-white rounded-lg shadow-md p-6 mb-4"&gt;
        &lt;div class="reservation-header flex justify-between items-start mb-4"&gt;
          &lt;div&gt;
            &lt;h3 class="text-lg font-semibold"&gt;Reservation #${reservation.reservation_id}&lt;/h3&gt;
            &lt;p class="text-gray-600"&gt;${reservationDate} at ${reservationTime}&lt;/p&gt;
            ${isAdmin && reservation.users ? `&lt;p class="text-sm text-gray-500"&gt;${reservation.users.full_name} (${reservation.users.email})&lt;/p&gt;` : ''}
          &lt;/div&gt;
          &lt;span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status] || 'bg-gray-100 text-gray-800'}"&gt;
            ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
          &lt;/span&gt;
        &lt;/div&gt;

        &lt;div class="reservation-details"&gt;
          &lt;div class="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;
            &lt;div&gt;
              &lt;p class="text-sm text-gray-600"&gt;Party Size: &lt;span class="font-medium"&gt;${reservation.party_size} ${reservation.party_size === 1 ? 'person' : 'people'}&lt;/span&gt;&lt;/p&gt;
              ${isAdmin ? `&lt;p class="text-sm text-gray-600"&gt;Phone: &lt;span class="font-medium"&gt;${reservation.users ? reservation.users.phone : 'N/A'}&lt;/span&gt;&lt;/p&gt;` : ''}
            &lt;/div&gt;
            &lt;div&gt;
              &lt;p class="text-sm text-gray-600"&gt;Created: &lt;span class="font-medium"&gt;${new Date(reservation.created_at).toLocaleDateString('en-ZA')}&lt;/span&gt;&lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          
          ${reservation.special_requests ? `
            &lt;div class="mt-4"&gt;
              &lt;p class="text-sm text-gray-600"&gt;Special Requests:&lt;/p&gt;
              &lt;p class="text-sm text-gray-800 bg-gray-50 p-2 rounded mt-1"&gt;${reservation.special_requests}&lt;/p&gt;
            &lt;/div&gt;
          ` : ''}
        &lt;/div&gt;

        ${isAdmin ? this.createAdminReservationActions(reservation) : this.createUserReservationActions(reservation)}
      &lt;/div&gt;
    `;
  }

  /**
   * Generate HTML for admin action buttons
   * @param {Object} reservation - Reservation data
   * @returns {string} - HTML for admin actions
   */
  createAdminReservationActions(reservation) {
    return `
      &lt;div class="admin-actions border-t pt-4 mt-4"&gt;
        &lt;div class="flex gap-2"&gt;
          ${reservation.status === 'pending' ? `
            &lt;button class="confirm-reservation-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}"&gt;
              Confirm
            &lt;/button&gt;
            &lt;button class="cancel-reservation-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}"&gt;
              Cancel
            &lt;/button&gt;
          ` : ''}
          
          ${reservation.status === 'confirmed' ? `
            &lt;button class="cancel-reservation-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}"&gt;
              Cancel
            &lt;/button&gt;
          ` : ''}
        &lt;/div&gt;
      &lt;/div&gt;
    `;
  }

  /**
   * Generate HTML for user action buttons
   * @param {Object} reservation - Reservation data
   * @returns {string} - HTML for user actions
   */
  createUserReservationActions(reservation) {
    // Only allow cancellation if reservation is in the future
    const now = new Date();
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    const canCancel = reservation.status !== 'cancelled' && reservationDateTime > now;

    return `
      &lt;div class="user-actions border-t pt-4 mt-4"&gt;
        &lt;div class="flex gap-2"&gt;
          ${canCancel ? `
            &lt;button class="cancel-user-reservation-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}"&gt;
              Cancel Reservation
            &lt;/button&gt;
          ` : ''}
        &lt;/div&gt;
      &lt;/div&gt;
    `;
  }

  /**
   * Set up event listeners for admin reservation actions
   */
  initializeAdminReservationManagement() {
    document.addEventListener('click', async (e) =&gt; {
      // Handle reservation confirmation
      if (e.target.classList.contains('confirm-reservation-btn')) {
        const reservationId = e.target.dataset.reservationId;
        await this.updateReservationStatus(reservationId, 'confirmed');
        
        if (typeof this.refreshReservationsDisplay === 'function') {
          this.refreshReservationsDisplay();
        }
      }
      
      // Handle reservation cancellation by admin
      if (e.target.classList.contains('cancel-reservation-btn')) {
        const reservationId = e.target.dataset.reservationId;
        if (confirm('Are you sure you want to cancel this reservation?')) {
          await this.updateReservationStatus(reservationId, 'cancelled');
          
          if (typeof this.refreshReservationsDisplay === 'function') {
            this.refreshReservationsDisplay();
          }
        }
      }
    });
  }

  /**
   * Set up event listeners for user reservation actions
   */
  initializeUserReservationManagement() {
    document.addEventListener('click', async (e) =&gt; {
      // Handle reservation cancellation by user
      if (e.target.classList.contains('cancel-user-reservation-btn')) {
        const reservationId = e.target.dataset.reservationId;
        if (confirm('Are you sure you want to cancel this reservation?')) {
          await this.cancelReservation(reservationId);
          
          if (typeof this.refreshReservationsDisplay === 'function') {
            this.refreshReservationsDisplay();
          }
        }
      }
    });
  }

  /**
   * Show a success notification
   * @param {string} message - Message to display
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show an error notification
   * @param {string} message - Error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Display a notification popup
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, info)
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove notification after 3 seconds
    setTimeout(() =&gt; {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Validate reservation form data
   * @param {Object} data - Reservation data to validate
   * @returns {Array} - List of validation errors, empty if valid
   */
  validateReservationData(data) {
    const errors = [];

    // Required fields
    if (!data.reservation_date) {
      errors.push('Reservation date is required');
    }

    if (!data.reservation_time) {
      errors.push('Reservation time is required');
    }

    // Party size limits
    if (!data.party_size || data.party_size < 1) {
      errors.push('Party size must be at least 1');
    }

    if (data.party_size > 20) {
      errors.push('Party size cannot exceed 20 people');
    }

    // Future date validation
    if (data.reservation_date && data.reservation_time) {
      const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
      const now = new Date();
      
      if (reservationDateTime <= now) {
        errors.push('Reservation must be scheduled for a future date and time');
      }
    }

    return errors;
  }

  /**
   * Get available time slots for reservation
   * @returns {Array} - List of available time slots
   */
  getAvailableTimeSlots() {
    const slots = [];
    const openHour = 11; // 11 AM
    const closeHour = 22; // 10 PM
    
    // Generate 30-minute time slots
    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReservationHandler };
}
