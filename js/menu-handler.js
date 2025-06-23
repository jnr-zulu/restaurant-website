/**
 * MenuHandler Class
 * Manages menu display, cart operations, and order processing for a waffle shop
 */
class MenuHandler {
  /**
   * Initialize the MenuHandler with cart data from localStorage
   */
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('waffleCart')) || [];
    this.categories = [];
    this.menuItems = [];
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  }

  /**
   * Load menu categories and items from the server
   * @async
   */
  async loadMenu() {
    try {
      // Load categories
      const categoriesResponse = await fetch('/.netlify/functions/get-categories');
      if (!categoriesResponse.ok) throw new Error('Failed to load categories');
      this.categories = await categoriesResponse.json();

      // Load menu items
      const menuResponse = await fetch('/.netlify/functions/get-menu');
      if (!menuResponse.ok) throw new Error('Failed to load menu');
      this.menuItems = await menuResponse.json();

      this.displayMenu();
      this.updateCartDisplay();
    } catch (error) {
      console.error('Error loading menu:', error);
      this.showError('Failed to load menu. Please refresh the page.');
    }
  }

  /**
   * Display menu categories and items on the page
   */
  displayMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    menuContainer.innerHTML = '';

    this.categories.forEach(category => {
      // Filter items by category
      const categoryItems = this.menuItems.filter(item => 
        item.category_id === category.category_id
      );

      if (categoryItems.length === 0) return;

      // Create category section
      const categorySection = document.createElement('div');
      categorySection.className = 'menu-category mb-8';
      categorySection.innerHTML = `
        <div class="category-header mb-6">
          <h3 class="category-title text-2xl font-bold text-amber-800 mb-2">${category.name}</h3>
          <p class="category-description text-gray-600">${category.description}</p>
        </div>
        <div class="menu-items-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="category-${category.category_id}">
        </div>
      `;

      const itemsGrid = categorySection.querySelector('.menu-items-grid');
      
      // Add each item to the grid
      categoryItems.forEach(item => {
        const itemCard = this.createMenuItemCard(item);
        itemsGrid.appendChild(itemCard);
      });

      menuContainer.appendChild(categorySection);
    });
  }

  /**
   * Create HTML card for menu item
   * @param {Object} item - Menu item data
   * @returns {HTMLElement} Card element
   */
  createMenuItemCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-item-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow';
    
    // Generate HTML for the card
    card.innerHTML = `
      <div class="menu-item-image h-48 bg-gray-200 relative">
        <img src="${item.image_url}" alt="${item.name}" 
             class="w-full h-full object-cover" 
             onerror="this.src='img/placeholder-waffle.jpg'">
        ${!item.is_available ? '<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span class="text-white font-bold">Unavailable</span></div>' : ''}
      </div>
      <div class="p-4">
        <h4 class="menu-item-name text-lg font-semibold text-gray-800 mb-2">${item.name}</h4>
        <p class="menu-item-description text-gray-600 text-sm mb-3">${item.description}</p>
        <div class="flex justify-between items-center">
          <span class="menu-item-price text-xl font-bold text-amber-600">R${item.price}</span>
          ${item.is_available ? `
            <button class="add-to-cart-btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors" 
                    data-item-id="${item.item_id}">
              Add to Cart
            </button>
          ` : `
            <button class="bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed" disabled>
              Unavailable
            </button>
          `}
        </div>
      </div>
    `;

    // Add event listener for add to cart button
    const addButton = card.querySelector('.add-to-cart-btn');
    if (addButton) {
      addButton.addEventListener('click', () => this.addToCart(item));
    }

    return card;
  }

  /**
   * Add menu item to cart
   * @param {Object} item - Menu item to add
   */
  addToCart(item) {
    const existingItem = this.cart.find(cartItem => cartItem.item_id === item.item_id);
    
    if (existingItem) {
      // Update quantity if item already in cart
      existingItem.quantity += 1;
      existingItem.subtotal = existingItem.quantity * item.price;
    } else {
      // Add new item to cart
      this.cart.push({
        item_id: item.item_id,
        name: item.name,
        price: item.price,
        quantity: 1,
        subtotal: item.price,
        special_instructions: ''
      });
    }

    this.saveCart();
    this.updateCartDisplay();
    this.showSuccess(`${item.name} added to cart!`);
  }

  /**
   * Remove item from cart
   * @param {number} itemId - ID of item to remove
   */
  removeFromCart(itemId) {
    this.cart = this.cart.filter(item => item.item_id !== itemId);
    this.saveCart();
    this.updateCartDisplay();
  }

  /**
   * Update quantity of item in cart
   * @param {number} itemId - ID of item to update
   * @param {number} newQuantity - New quantity value
   */
  updateCartItemQuantity(itemId, newQuantity) {
    const item = this.cart.find(cartItem => cartItem.item_id === itemId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = newQuantity;
        item.subtotal = item.quantity * item.price;
        this.saveCart();
        this.updateCartDisplay();
      }
    }
  }

  /**
   * Calculate total price of all items in cart
   * @returns {number} Total cart value
   */
  getCartTotal() {
    return this.cart.reduce((total, item) => total + item.subtotal, 0);
  }

  /**
   * Update cart count, total price, and items display
   */
  updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartItems = document.getElementById('cart-items');

    // Update item count badge
    if (cartCount) {
      const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
      cartCount.textContent = totalItems;
      cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
    }

    // Update total price display
    if (cartTotal) {
      cartTotal.textContent = `R${this.getCartTotal().toFixed(2)}`;
    }

    // Update cart items list
    if (cartItems) {
      this.displayCartItems(cartItems);
    }
  }

  /**
   * Display all cart items in provided container
   * @param {HTMLElement} container - Container to display items in
   */
  displayCartItems(container) {
    if (this.cart.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
      return;
    }

    // Generate HTML for each cart item
    container.innerHTML = this.cart.map(item => `
      <div class="cart-item flex justify-between items-center p-4 border-b">
        <div class="flex-1">
          <h4 class="font-semibold">${item.name}</h4>
          <p class="text-gray-600">R${item.price} each</p>
          <div class="flex items-center mt-2">
            <button class="quantity-btn bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" 
                    onclick="menuHandler.updateCartItemQuantity(${item.item_id}, ${item.quantity - 1})">-</button>
            <span class="mx-3 font-semibold">${item.quantity}</span>
            <button class="quantity-btn bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded" 
                    onclick="menuHandler.updateCartItemQuantity(${item.item_id}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-lg">R${item.subtotal.toFixed(2)}</p>
          <button class="text-red-500 hover:text-red-700 text-sm mt-1" 
                  onclick="menuHandler.removeFromCart(${item.item_id})">Remove</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Save cart data to localStorage
   */
  saveCart() {
    localStorage.setItem('waffleCart', JSON.stringify(this.cart));
  }

  /**
   * Clear all items from cart
   */
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartDisplay();
  }

  /**
   * Process order checkout
   * @param {Object} customerInfo - Customer information
   * @param {string} orderType - Type of order (pickup/delivery)
   * @returns {Object|boolean} Order data or false if failed
   * @async
   */
  async processCheckout(customerInfo, orderType = 'pickup') {
    if (this.cart.length === 0) {
      this.showError('Your cart is empty!');
      return false;
    }

    try {
      // Prepare order data
      const orderData = {
        user_id: this.currentUser ? this.currentUser.user_id : null,
        total_amount: this.getCartTotal(),
        status: 'pending',
        payment_status: 'pending',
        delivery_address: customerInfo.address || null,
        order_type: orderType
      };

      // Prepare order items
      const orderItems = this.cart.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        special_instructions: item.special_instructions
      }));

      // Submit order to server
      const response = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderData, orderItems })
      });

      const result = await response.json();

      if (result.success) {
        this.clearCart();
        this.showSuccess('Order placed successfully! You will receive a confirmation email shortly.');
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      this.showError('Failed to place order. Please try again.');
      return false;
    }
  }

  /**
   * Filter menu to show only specific category
   * @param {string|number} categoryId - Category ID to filter by, or 'all'
   */
  filterByCategory(categoryId) {
    const allItems = document.querySelectorAll('.menu-category');
    
    if (categoryId === 'all') {
      // Show all categories
      allItems.forEach(item => item.style.display = 'block');
    } else {
      // Show only matching category
      allItems.forEach(category => {
        const categoryIdFromElement = category.querySelector('.menu-items-grid').id.split('-')[1];
        category.style.display = categoryIdFromElement === categoryId.toString() ? 'block' : 'none';
      });
    }
  }

  /**
   * Search menu items by name or description
   * @param {string} searchTerm - Term to search for
   */
  searchMenu(searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const menuCards = document.querySelectorAll('.menu-item-card');

    // Show/hide menu items based on search term
    menuCards.forEach(card => {
      const itemName = card.querySelector('.menu-item-name').textContent.toLowerCase();
      const itemDescription = card.querySelector('.menu-item-description').textContent.toLowerCase();
      
      if (itemName.includes(normalizedSearch) || itemDescription.includes(normalizedSearch)) {
        card.style.display = 'block';
        card.parentElement.parentElement.style.display = 'block'; // Show category
      } else {
        card.style.display = 'none';
      }
    });

    // Hide empty categories
    const categories = document.querySelectorAll('.menu-category');
    categories.forEach(category => {
      const visibleItems = category.querySelectorAll('.menu-item-card[style*="block"], .menu-item-card:not([style])');
      if (visibleItems.length === 0) {
        category.style.display = 'none';
      }
    });
  }

  /**
   * Display success notification
   * @param {string} message - Message to display
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Display error notification
   * @param {string} message - Message to display
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Display notification popup
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success/error/info)
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

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize menu handler when DOM is loaded
let menuHandler;
document.addEventListener('DOMContentLoaded', function() {
  menuHandler = new MenuHandler();
  
  // Load menu if we're on a page that needs it
  if (document.getElementById('menu-container')) {
    menuHandler.loadMenu();
  }
  
  // Update cart display on all pages
  menuHandler.updateCartDisplay();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MenuHandler;
}
