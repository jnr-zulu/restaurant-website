// js/reservation-handler.js
class ReservationHandler {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  }

  // Create a new reservation
  async createReservation(reservationData) {
    try {
      if (!this.currentUser) {
        throw new Error('Please log in to make a reservation');
      }

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

  // Get user reservations
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

  // Get all reservations (admin only)
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

  // Update reservation status (admin only)
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

  // Cancel reservation (user or admin)
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

  // Display reservations in a container
  displayReservations(reservations, containerId, isAdmin = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (reservations.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No reservations found</p>';
      return;
    }

    container.innerHTML = reservations.map(reservation => this.createReservationCard(reservation, isAdmin)).join('');
  }

  // Create reservation card HTML
  createReservationCard(reservation, isAdmin = false) {
    const reservationDate = new Date(reservation.reservation_date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reservationTime = reservation.reservation_time.substring(0, 5); // Remove seconds

    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return `
      <div class="reservation-card bg-white rounded-lg shadow-md p-6 mb-4">
        <div class="reservation-header flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-semibold">Reservation #${reservation.reservation_id}</h3>
            <p class="text-gray-600">${reservationDate} at ${reservationTime}</p>
            ${isAdmin && reservation.users ? `<p class="text-sm text-gray-500">${reservation.users.full_name} (${reservation.users.email})</p>` : ''}
          </div>
          <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status] || 'bg-gray-100 text-gray-800'}">
            ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
          </span>
        </div>

        <div class="reservation-details">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Party Size: <span class="font-medium">${reservation.party_size} ${reservation.party_size === 1 ? 'person' : 'people'}</span></p>
              ${isAdmin ? `<p class="text-sm text-gray-600">Phone: <span class="font-medium">${reservation.users ? reservation.users.phone : 'N/A'}</span></p>` : ''}
            </div>
            <div>
              <p class="text-sm text-gray-600">Created: <span class="font-medium">${new Date(reservation.created_at).toLocaleDateString('en-ZA')}</span></p>
            </div>
          </div>
          
          ${reservation.special_requests ? `
            <div class="mt-4">
              <p class="text-sm text-gray-600">Special Requests:</p>
              <p class="text-sm text-gray-800 bg-gray-50 p-2 rounded mt-1">${reservation.special_requests}</p>
            </div>
          ` : ''}
        </div>

        ${isAdmin ? this.createAdminReservationActions(reservation) : this.createUserReservationActions(reservation)}
      </div>
    `;
  }

  // Create admin action buttons for reservations
  createAdminReservationActions(reservation) {
    return `
      <div class="admin-actions border-t pt-4 mt-4">
        <div class="flex gap-2">
          ${reservation.status === 'pending' ? `
            <button class="confirm-reservation-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}">
              Confirm
            </button>
            <button class="cancel-reservation-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}">
              Cancel
            </button>
          ` : ''}
          
          ${reservation.status === 'confirmed' ? `
            <button class="cancel-reservation-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}">
              Cancel
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Create user action buttons for reservations
  createUserReservationActions(reservation) {
    const now = new Date();
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
    const canCancel = reservation.status !== 'cancelled' && reservationDateTime > now;

    return `
      <div class="user-actions border-t pt-4 mt-4">
        <div class="flex gap-2">
          ${canCancel ? `
            <button class="cancel-user-reservation-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm" 
                    data-reservation-id="${reservation.reservation_id}">
              Cancel Reservation
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Initialize admin reservation management
  initializeAdminReservationManagement() {
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('confirm-reservation-btn')) {
        const reservationId = e.target.dataset.reservationId;
        await this.updateReservationStatus(reservationId, 'confirmed');
        
        if (typeof this.refreshReservationsDisplay === 'function') {
          this.refreshReservationsDisplay();
        }
      }
      
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

  // Initialize user reservation management
  initializeUserReservationManagement() {
    document.addEventListener('click', async (e) => {
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

  // Show success message
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  // Show error message
  showError(message) {
    this.showNotification(message, 'error');
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Validate reservation data
  validateReservationData(data) {
    const errors = [];

    if (!data.reservation_date) {
      errors.push('Reservation date is required');
    }

    if (!data.reservation_time) {
      errors.push('Reservation time is required');
    }

    if (!data.party_size || data.party_size < 1) {
      errors.push('Party size must be at least 1');
    }

    if (data.party_size > 20) {
      errors.push('Party size cannot exceed 20 people');
    }

    // Check if reservation is in the future
    if (data.reservation_date && data.reservation_time) {
      const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
      const now = new Date();
      
      if (reservationDateTime <= now) {
        errors.push('Reservation must be scheduled for a future date and time');
      }
    }

    return errors;
  }

  // Get available time slots
  getAvailableTimeSlots() {
    const slots = [];
    const openHour = 11; // 11 AM
    const closeHour = 22; // 10 PM
    
    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
  }
}

// Export classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OrderHandler, ReservationHandler };
}