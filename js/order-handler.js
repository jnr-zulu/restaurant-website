// order-handler.js
/**
 * Main order handling module for food ordering system
 * Handles delivery/pickup options, menu display, and order management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get references to elements
    const deliveryOption = document.getElementById('delivery-option');
    const pickupOption = document.getElementById('pickup-option');
    const deliveryForm = document.getElementById('delivery-form');
    const pickupForm = document.getElementById('pickup-form');
    const menuSection = document.getElementById('menu-section');
    const addressForm = document.getElementById('address-form');
    const continueToMenuBtn = document.getElementById('continue-to-menu');
    
    // Setup order type selection
    deliveryOption.addEventListener('click', function() {
        deliveryOption.classList.add('active');
        pickupOption.classList.remove('active');
        deliveryForm.style.display = 'block';
        pickupForm.style.display = 'none';
    });
    
    pickupOption.addEventListener('click', function() {
        pickupOption.classList.add('active');
        deliveryOption.classList.remove('active');
        pickupForm.style.display = 'block';
        deliveryForm.style.display = 'none';
    });
    
    // Function to show menu section and hide order options
    function showMenuSection() {
        menuSection.style.display = 'block';
        document.querySelector('.order-options').style.display = 'none';
        
        // Load menu items from database
        loadMenuItemsFromSupabase();
    }
    
    // Handle "Continue to Menu" button for pickup option
    if (continueToMenuBtn) {
        continueToMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMenuSection();
        });
    }
    
    // Handle delivery address form submission
    if (addressForm) {
        addressForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const addressData = {
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                province: document.getElementById('province').value,
                postal_code: document.getElementById('postal').value,
                delivery_notes: document.getElementById('delivery-notes').value,
                user_id: getCurrentUserId() // Function defined elsewhere
            };
            
            try {
                // Save address to database
                await saveDeliveryAddress(addressData);
                showMenuSection();
            } catch (error) {
                console.error('Error saving address:', error);
                alert('There was an error saving your address. Please try again.');
            }
        });
    }
    
    /**
     * Loads menu items from database and organizes by category
     */
    async function loadMenuItemsFromSupabase() {
        try {
            const menuItems = await fetchMenuItems();
            
            // Organize menu items by category
            const categorizedItems = {
                'sweet': [],
                'savory': [],
                'beverages': [],
                'combos': []
            };
            
            menuItems.forEach(item => {
                if (categorizedItems[item.category]) {
                    categorizedItems[item.category].push(item);
                }
            });
            
            // Populate each category in the menu
            for (const [category, items] of Object.entries(categorizedItems)) {
                const categoryContainer = document.getElementById(category);
                if (categoryContainer) {
                    const menuGrid = categoryContainer.querySelector('.menu-grid');
                    if (menuGrid) {
                        menuGrid.innerHTML = ''; // Clear existing items
                        
                        items.forEach(item => {
                            const itemElement = createMenuItemElement(item);
                            menuGrid.appendChild(itemElement);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
        }
    }
    
    /**
     * Creates DOM element for a menu item
     * @param {Object} item - Menu item data
     * @returns {HTMLElement} - Menu item DOM element
     */
    function createMenuItemElement(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        menuItem.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}">
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h4>${item.name}</h4>
                    <span class="price">R${item.price.toFixed(2)}</span>
                </div>
                <p>${item.description}</p>
                <div class="quantity-selector">
                    <label for="quantity-${item.id}">Quantity:</label>
                    <div class="quantity-controls">
                        <button type="button" class="quantity-btn decrease">-</button>
                        <input type="number" class="quantity-input" id="quantity-${item.id}" value="1" min="1">
                        <button type="button" class="quantity-btn increase">+</button>
                    </div>
                </div>
                <button class="btn primary-btn add-to-cart" 
                    data-id="${item.id}" 
                    data-name="${item.name}" 
                    data-price="${item.price}">Add to Cart</button>
            </div>
        `;
        
        return menuItem;
    }
});

/**
 * OrderHandler class - Manages user orders, admin functionality
 */
class OrderHandler {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  }

  /**
   * Retrieves orders for the current user
   * @param {string} userId - Optional user ID, defaults to current user
   * @returns {Array} - List of user orders
   */
  async getUserOrders(userId = null) {
    try {
      const queryUserId = userId || (this.currentUser ? this.currentUser.user_id : null);
      if (!queryUserId) {
        throw new Error('User not logged in');
      }

      const response = await fetch(`/.netlify/functions/get-orders?user_id=${queryUserId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const orders = await response.json();
      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  /**
   * Admin function to get all orders
   * @param {string} status - Optional status filter
   * @returns {Array} - List of all orders
   */
  async getAllOrders(status = null) {
    try {
      let url = '/.netlify/functions/get-orders';
      if (status) {
        url += `?status=${status}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const orders = await response.json();
      return orders;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }

  /**
   * Updates the status of an order (admin only)
   * @param {string} orderId - Order ID to update
   * @param {string} newStatus - New order status
   * @param {string} paymentStatus - Optional payment status update
   * @returns {Object|boolean} - Updated order or false if failed
   */
  async updateOrderStatus(orderId, newStatus, paymentStatus = null) {
    try {
      const updateData = {
        order_id: orderId,
        status: newStatus
      };

      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const response = await fetch('/.netlify/functions/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      if (result.success) {
        this.showSuccess('Order status updated successfully!');
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      this.showError('Failed to update order status');
      return false;
    }
  }

  /**
   * Displays orders in a specified container
   * @param {Array} orders - List of orders to display
   * @param {string} containerId - ID of container element
   * @param {boolean} isAdmin - Whether to show admin controls
   */
  displayOrders(orders, containerId, isAdmin = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">No orders found</p>';
      return;
    }

    container.innerHTML = orders.map(order => this.createOrderCard(order, isAdmin)).join('');
  }

  /**
   * Creates HTML for an order card
   * @param {Object} order - Order data
   * @param {boolean} isAdmin - Whether to show admin controls
   * @returns {string} - HTML for the order card
   */
  createOrderCard(order, isAdmin = false) {
    const orderDate = new Date(order.order_date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-orange-100 text-orange-800',
      'ready': 'bg-green-100 text-green-800',
      'delivered': 'bg-green-200 text-green-900',
      'cancelled': 'bg-red-100 text-red-800'
    };

    const paymentColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };

    return `
      <div class="order-card bg-white rounded-lg shadow-md p-6 mb-4">
        <div class="order-header flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-semibold">Order #${order.order_id}</h3>
            <p class="text-gray-600">${orderDate}</p>
            ${isAdmin && order.users ? `<p class="text-sm text-gray-500">${order.users.full_name} (${order.users.email})</p>` : ''}
          </div>
          <div class="text-right">
            <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'} mb-2">
              ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <br>
            <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${paymentColors[order.payment_status] || 'bg-gray-100 text-gray-800'}">
              ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
        </div>

        <div class="order-details mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-600">Order Type: <span class="font-medium">${order.order_type}</span></p>
              ${order.delivery_address ? `<p class="text-sm text-gray-600">Address: <span class="font-medium">${order.delivery_address}</span></p>` : ''}
            </div>
            <div>
              <p class="text-lg font-bold text-right">Total: R${parseFloat(order.total_amount).toFixed(2)}</p>
            </div>
          </div>

          <div class="order-items">
            <h4 class="font-medium mb-2">Items:</h4>
            <div class="space-y-2">
              ${order.order_items ? order.order_items.map(item => `
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <span class="font-medium">${item.menu_items ? item.menu_items.name : 'Unknown Item'}</span>
                    <span class="text-gray-600 ml-2">x${item.quantity}</span>
                    ${item.special_instructions ? `<p class="text-sm text-gray-500 mt-1">Note: ${item.special_instructions}</p>` : ''}
                  </div>
                  <span class="font-medium">R${parseFloat(item.subtotal).toFixed(2)}</span>
                </div>
              `).join('') : '<p class="text-gray-500">No items found</p>'}
            </div>
          </div>
        </div>

        ${isAdmin ? this.createAdminOrderActions(order) : ''}
      </div>
    `;
  }

  /**
   * Creates HTML for admin order action controls
   * @param {Object} order - Order data
   * @returns {string} - HTML for the admin actions
   */
  createAdminOrderActions(order) {
    const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    const paymentOptions = ['pending', 'paid', 'failed'];

    return `
      <div class="admin-actions border-t pt-4">
        <div class="flex flex-wrap gap-2">
          <select class="status-select bg-white border border-gray-300 rounded px-3 py-1 text-sm" 
                  data-order-id="${order.order_id}" data-current-status="${order.status}">
            ${statusOptions.map(status => 
              `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`
            ).join('')}
          </select>
          
          <select class="payment-select bg-white border border-gray-300 rounded px-3 py-1 text-sm" 
                  data-order-id="${order.order_id}" data-current-payment="${order.payment_status}">
            ${paymentOptions.map(status => 
              `<option value="${status}" ${status === order.payment_status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`
            ).join('')}
          </select>
          
          <button class="update-order-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm" 
                  data-order-id="${order.order_id}">
            Update
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Sets up event listeners for admin order management
   */
  initializeAdminOrderManagement() {
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('update-order-btn')) {
        const orderId = e.target.dataset.orderId;
        const statusSelect = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
        const paymentSelect = document.querySelector(`.payment-select[data-order-id="${orderId}"]`);
        
        if (statusSelect && paymentSelect) {
          const newStatus = statusSelect.value;
          const newPaymentStatus = paymentSelect.value;
          
          await this.updateOrderStatus(orderId, newStatus, newPaymentStatus);
          
          // Refresh the orders display
          if (typeof this.refreshOrdersDisplay === 'function') {
            this.refreshOrdersDisplay();
          }
        }
      }
    });
  }

  /**
   * Shows a success notification
   * @param {string} message - Message to display
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Shows an error notification
   * @param {string} message - Message to display
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Shows a notification popup
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

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}
