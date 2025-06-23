/**
 * Authentication and User Management System
 * This module handles user authentication, registration, profile management, and order display.
 */

// Initialize all forms and check authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup forms based on page context
    initializeForms();
    
    // Check authentication status for protected pages
    checkAuth();
});

/**
 * Initialize all forms based on the current page
 */
function initializeForms() {
    // Initialize login form if present
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        initializeLoginForm();
    }
    
    // Initialize register form if present
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        initializeRegisterForm();
    }
    
    // Initialize profile page if on profile page
    if (window.location.href.includes('profile.html')) {
        initializeProfilePage();
    }
}

/**
 * Validate form inputs based on form type
 * @param {string} formId - ID of the form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(formId) {
  // Create reusable email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Different validation based on form type
  switch(formId) {
    case 'login-form':
      const email = document.getElementById('login-email')?.value;
      const password = document.getElementById('login-password')?.value;
      
      // Check required fields
      if (!email || !password) {
        alert('Please fill out all required fields');
        return false;
      }
      
      // Validate email format
      if (!emailPattern.test(email)) {
        alert('Please enter a valid email address');
        return false;
      }
      
      return true;
      
    case 'register-form':
      const username = document.getElementById('register-username')?.value;
      const regEmail = document.getElementById('register-email')?.value;
      const regPassword = document.getElementById('register-password')?.value;
      const confirmPassword = document.getElementById('confirm-password')?.value;
      
      // Check required fields
      if (!username || !regEmail || !regPassword || !confirmPassword) {
        alert('Please fill out all required fields');
        return false;
      }
      
      // Validate email format
      if (!emailPattern.test(regEmail)) {
        alert('Please enter a valid email address');
        return false;
      }
      
      // Check password match
      if (regPassword !== confirmPassword) {
        alert('Passwords do not match');
        return false;
      }
      
      return true;
      
    case 'profile-form':
      // Profile form validation
      // Add your profile validation logic here
      return true;
      
    default:
      return false; // Unknown form
  }
}

/**
 * Initialize the login form with event listeners
 */
function initializeLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form first
        if (!validateForm('login-form')) {
            return;
        }
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Check admin credentials
        if (email === 'admin@waffleheaven.com' && password === '0824669786Jnr') {
            login({
                id: 'admin',
                username: 'admin',
                email: email,
                role: 'admin'
            });
            window.location.href = 'admin/dashboard.html';
            return;
        }
        
        // Check staff credentials
        if (email === 'staff@waffleheaven.com' && password === '0824669786Jnr') {
            login({
                id: 'staff',
                username: 'staff',
                email: email,
                role: 'staff'
            });
            window.location.href = 'staff/orders.html';
            return;
        }
        
        // Check registered users in localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);
        
        if (user && user.password === password) {
            // Remove password before storing in session
            const { password, ...userWithoutPassword } = user;
            login(userWithoutPassword);
            window.location.href = '../index.html';
            return;
        }
        
        // Show error if no matching credentials
        showFormError(loginForm, 'Invalid email or password');
    });
}

/**
 * Initialize the registration form with event listeners
 */
function initializeRegisterForm() {
    const registerForm = document.getElementById('register-form');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form first
        if (!validateForm('register-form')) {
            return;
        }
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        // Get existing users
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if email already exists
        if (users.some(user => user.email === email)) {
            showFormError(registerForm, 'Email already registered');
            return;
        }
        
        // Check if username already exists
        if (users.some(user => user.username === username)) {
            showFormError(registerForm, 'Username already taken');
            return;
        }
        
        // Create new user object
        const newUser = {
            id: Date.now().toString(),
            username: username,
            email: email,
            password: password,
            role: 'customer',
            createdAt: new Date().toISOString()
        };
        
        // Save to localStorage
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Login the new user
        const { password: pwd, ...userWithoutPassword } = newUser;
        login(userWithoutPassword);
        
        // Redirect to homepage
        window.location.href = '../index.html';
    });
}

/**
 * Initialize the profile page with user data and event listeners
 */
function initializeProfilePage() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Populate profile information
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email;
    
    // Initialize profile edit form
    const profileForm = document.getElementById('profile-form');
    
    if (profileForm) {
        // Populate form with current user data
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
        
        // Handle form submission
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Display user orders
    displayUserOrders();
}

/**
 * Handle profile form update submission
 * @param {Event} e - The form submission event
 */
function handleProfileUpdate(e) {
    e.preventDefault();
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const profileForm = document.getElementById('profile-form');
    
    // Validate form
    if (!validateForm('profile-form')) {
        return;
    }
    
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    // Get all users
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find current user
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) {
        showFormError(profileForm, 'User not found');
        return;
    }
    
    // Validate current password if provided
    if (currentPassword && currentPassword !== users[userIndex].password) {
        showFormError(profileForm, 'Current password is incorrect');
        return;
    }
    
    // Check if email is already taken by another user
    if (email !== user.email && users.some(u => u.email === email && u.id !== user.id)) {
        showFormError(profileForm, 'Email already registered by another user');
        return;
    }
    
    // Check if username is already taken by another user
    if (username !== user.username && users.some(u => u.username === username && u.id !== user.id)) {
        showFormError(profileForm, 'Username already taken by another user');
        return;
    }
    
    // Update user data
    users[userIndex].username = username;
    users[userIndex].email = email;
    
    // Update password if provided
    if (newPassword) {
        users[userIndex].password = newPassword;
    }
    
    // Save updated users to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update current user in session
    const { password, ...updatedUser } = users[userIndex];
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Show success message
    showFormSuccess(profileForm, 'Profile updated successfully');
}

/**
 * Display user orders in the order history container
 */
function displayUserOrders() {
    const orderHistoryContainer = document.getElementById('order-history');
    
    if (!orderHistoryContainer) return;
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Filter orders for current user
    const userOrders = orders.filter(order => order.customer.email === user.email);
    
    // Sort orders by date (newest first)
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear container
    orderHistoryContainer.innerHTML = '';
    
    // Show message if no orders
    if (userOrders.length === 0) {
        orderHistoryContainer.innerHTML = '<p class="no-orders">You have no order history yet.</p>';
        return;
    }
    
    // Create HTML for each order
    userOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-card';
        
        // Format date
        const orderDate = new Date(order.date);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Generate item list
        let itemsList = '';
        order.items.forEach(item => {
            itemsList += `<li>${item.quantity}x ${item.name}</li>`;
        });
        
        // Build order card HTML
        orderElement.innerHTML = `
            <div class="order-header">
                <div>
                    <h3>Order #${order.id}</h3>
                    <span class="order-date">${formattedDate}</span>
                </div>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-content">
                <div class="order-items">
                    <h4>Items</h4>
                    <ul>${itemsList}</ul>
                </div>
                <div class="order-summary">
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Type:</strong> ${order.orderType}</p>
                </div>
            </div>
            <div class="order-actions">
                <button class="btn secondary-btn view-order-btn" data-id="${order.id}">View Details</button>
            </div>
        `;
        
        orderHistoryContainer.appendChild(orderElement);
    });
    
    // Add event listeners to view order buttons
    const viewOrderButtons = document.querySelectorAll('.view-order-btn');
    viewOrderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            viewOrderDetails(orderId);
        });
    });
}

/**
 * Display detailed order information in a modal
 * @param {string} orderId - ID of the order to display
 */
function viewOrderDetails(orderId) {
    // Get all orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Find order by ID
    const order = orders.find(order => order.id.toString() === orderId);
    
    if (!order) return;
    
    // Create modal for order details
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Format date with detailed information
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
    
    // Generate items HTML
    let itemsHTML = '';
    order.items.forEach(item => {
        itemsHTML += `
            <div class="order-detail-item">
                <div class="item-name">${item.quantity}x ${item.name}</div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    // Build modal HTML
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Order Details #${order.id}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-details">
                    <div class="order-info">
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Status:</strong> <span class="status ${order.status}">${order.status}</span></p>
                        <p><strong>Order Type:</strong> ${order.orderType}</p>
                    </div>
                    
                    <div class="order-items-details">
                        <h3>Items</h3>
                        ${itemsHTML}
                    </div>
                    
                    <div class="order-price-summary">
                        <div class="price-row">
                            <span>Subtotal</span>
                            <span>$${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="price-row">
                            <span>Tax</span>
                            <span>$${order.tax.toFixed(2)}</span>
                        </div>
                        <div class="price-row total">
                            <span>Total</span>
                            <span>$${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Add event listeners for closing the modal
    setupModalCloseEvents(modal);
}

/**
 * Setup event listeners for closing a modal
 * @param {HTMLElement} modal - The modal element
 */
function setupModalCloseEvents(modal) {
    // Close on X button click
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', function() {
        modal.remove();
    });
    
    // Close when clicking outside of content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Log in a user and store their information
 * @param {Object} user - User object to store
 */
function login(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
}

/**
 * Log out a user and remove their information
 */
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    
    // Redirect to home page
    window.location.href = '../index.html';
}

/**
 * Check authentication status and redirect if needed
 */
function checkAuth() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Get current page path
    const path = window.location.pathname;
    
    // Handle admin page access
    if (path.includes('/admin/') && (!isLoggedIn || currentUser?.role !== 'admin')) {
        window.location.href = '../login.html';
        return;
    }
    
    // Handle staff page access
    if (path.includes('/staff/') && (!isLoggedIn || (currentUser?.role !== 'staff' && currentUser?.role !== 'admin'))) {
        window.location.href = '../login.html';
        return;
    }
    
    // Setup logout buttons
    setupLogoutButtons();
}

/**
 * Setup event listeners for all logout buttons
 */
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
}

/**
 * Display an error message on a form
 * @param {HTMLElement} form - The form element
 * @param {string} message - Error message to display
 */
function showFormError(form, message) {
    // Remove any existing error messages
    const existingError = form.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    
    // Add to form
    form.insertBefore(errorElement, form.firstChild);
}

/**
 * Display a success message on a form
 * @param {HTMLElement} form - The form element
 * @param {string} message - Success message to display
 */
function showFormSuccess(form, message) {
    // Remove any existing messages
    const existingError = form.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    const existingSuccess = form.querySelector('.form-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create success element
    const successElement = document.createElement('div');
    successElement.className = 'form-success';
    successElement.textContent = message;
    
    // Add to form
    form.insertBefore(successElement, form.firstChild);
}
