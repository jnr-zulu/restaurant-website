document.addEventListener('DOMContentLoaded', function() {
    // Display cart items if on cart page
    if (window.location.href.includes('cart.html')) {
        displayCartItems();
        updateCartTotal();
    }
    
    // Initialize checkout process if on checkout page
    if (window.location.href.includes('checkout.html')) {
        initializeCheckout();
    }
});

// Add this function to your cart.js file
async function validateCart() {
  try {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // If cart is empty, no need to validate
    if (cartItems.length === 0) return [];
    
    // Call the Netlify function to validate cart
    const response = await fetch('/api/cart-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'validate',
        cartItems: cartItems
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update localStorage with consolidated cart
      localStorage.setItem('cartItems', JSON.stringify(result.cartItems));
      return result.cartItems;
    } else {
      console.error('Cart validation failed:', result.error);
      return cartItems; // Return original cart if validation fails
    }
  } catch (error) {
    console.error('Error validating cart:', error);
    return JSON.parse(localStorage.getItem('cartItems')) || [];
  }
}

// Modify your displayCartItems function to use validateCart
async function displayCartItems() {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  
  if (!cartItemsContainer) return;
  
  // Show loading state
  cartItemsContainer.innerHTML = '<div class="loading">Loading your cart...</div>';
  
  // Get validated cart items
  const cartItems = await validateCart();
  
  // Clear previous content
  cartItemsContainer.innerHTML = '';
  
  // Show/hide empty cart message
  if (cartItems.length === 0) {
    if (emptyCartMessage) {
      emptyCartMessage.style.display = 'block';
    }
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.style.display = 'none';
    }
    return;
  } else {
    if (emptyCartMessage) {
      emptyCartMessage.style.display = 'none';
    }
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.style.display = 'block';
    }
  }
}




function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    
    if (!cartItemsContainer) return;
    
    // Get cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Clear previous content
    cartItemsContainer.innerHTML = '';
    
    // Show/hide empty cart message
    if (cartItems.length === 0) {
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'block';
        }
        document.getElementById('checkout-btn').style.display = 'none';
        return;
    } else {
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }
        document.getElementById('checkout-btn').style.display = 'block';
    }
    
    // Create HTML for each cart item
    cartItems.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-img">
                <img src="../img/menu/${item.id}.jpg" alt="${item.name}" onerror="this.src='../img/menu/default.jpg'">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="item-price">R${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn decrease">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                    <button class="quantity-btn increase">+</button>
                </div>
                <p class="item-subtotal">R${(item.price * item.quantity).toFixed(2)}</p>
                <button class="remove-item-btn" data-id="${item.id}">Remove</button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Add event listeners to quantity buttons
    const decreaseButtons = document.querySelectorAll('.quantity-btn.decrease');
    const increaseButtons = document.querySelectorAll('.quantity-btn.increase');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    const removeButtons = document.querySelectorAll('.remove-item-btn');
    
    decreaseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            const itemId = input.getAttribute('data-id');
            let value = parseInt(input.value);
            
            if (value > 1) {
                value--;
                input.value = value;
                updateCartItemQuantity(itemId, value);
            }
        });
    });
    
    increaseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            const itemId = input.getAttribute('data-id');
            let value = parseInt(input.value);
            
            value++;
            input.value = value;
            updateCartItemQuantity(itemId, value);
        });
    });
    
    quantityInputs.forEach(input => {
        input.addEventListener('change', function() {
            const itemId = this.getAttribute('data-id');
            let value = parseInt(this.value);
            
            if (value < 1 || isNaN(value)) {
                value = 1;
                this.value = 1;
            }
            
            updateCartItemQuantity(itemId, value);
        });
    });
    
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            removeFromCart(itemId);
        });
    });
}

function updateCartTotal() {
    const subtotalElement = document.getElementById('cart-subtotal');
    const taxElement = document.getElementById('cart-tax');
    const totalElement = document.getElementById('cart-total');
    
    if (!subtotalElement || !taxElement || !totalElement) return;
    
    // Get cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Calculate subtotal
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate tax (assuming 15% tax rate)
    const taxRate = 0.15;
    const tax = subtotal * taxRate;
    
    // Calculate total
    const total = subtotal + tax;
    
    // Update elements
    subtotalElement.textContent = `R${subtotal.toFixed(2)}`;
    taxElement.textContent = `R${tax.toFixed(2)}`;
    totalElement.textContent = `R${total.toFixed(2)}`;
    
    // Store order summary in localStorage for use on checkout page
    const orderSummary = {
        subtotal: subtotal,
        tax: tax,
        total: total
    };
    
    localStorage.setItem('orderSummary', JSON.stringify(orderSummary));
}

function initializeCheckout() {
    // Get order summary from localStorage
    const orderSummary = JSON.parse(localStorage.getItem('orderSummary')) || {
        subtotal: 0,
        tax: 0,
        total: 0
    };
    
    // Get cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Update order summary on checkout page
    const subtotalElement = document.getElementById('checkout-subtotal');
    const taxElement = document.getElementById('checkout-tax');
    const totalElement = document.getElementById('checkout-total');
    
    if (subtotalElement) subtotalElement.textContent = `R${orderSummary.subtotal.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `R${orderSummary.tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `R${orderSummary.total.toFixed(2)}`;
    
    // Display order items in checkout summary
    const orderItemsContainer = document.getElementById('order-items');
    
    if (orderItemsContainer) {
        orderItemsContainer.innerHTML = '';
        
        cartItems.forEach(item => {
            const orderItemElement = document.createElement('div');
            orderItemElement.className = 'order-item';
            orderItemElement.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <span>R${(item.price * item.quantity).toFixed(2)}</span>
            `;
            
            orderItemsContainer.appendChild(orderItemElement);
        });
    }
    
    // Initialize checkout form
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm('checkout-form')) {
                return;
            }
            
            // Process payment (in a real app, this would connect to a payment processor)
            processOrder();
        });
    }
    
}

// These functions are called in your code but are not defined
// Add them to your cart.js file

// Function to update cart item quantity
function updateCartItemQuantity(itemId, quantity) {
    // Get current cart items
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Find the item to update
    const itemIndex = cartItems.findIndex(item => item.id == itemId);
    
    if (itemIndex !== -1) {
        // Update the quantity
        cartItems[itemIndex].quantity = quantity;
        
        // Save back to localStorage
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        // Update the display
        const subtotal = cartItems[itemIndex].price * quantity;
        const itemSubtotalElement = document.querySelector(`.quantity-input[data-id="${itemId}"]`)
            .closest('.cart-item-actions')
            .querySelector('.item-subtotal');
        
        if (itemSubtotalElement) {
            itemSubtotalElement.textContent = `R${subtotal.toFixed(2)}`;
        }
        
        // Update cart count and totals
        updateCartCount();
        updateCartTotal();
    }
}

// Function to remove item from cart
function removeFromCart(itemId) {
    // Get current cart items
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Filter out the item to remove
    cartItems = cartItems.filter(item => item.id != itemId);
    
    // Save back to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Update the display
    displayCartItems();
    updateCartCount();
    updateCartTotal();
}

// Function to update cart count in header
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Add this function to check cart data when page loads
function debugCart() {
    console.log('Cart data in localStorage:', localStorage.getItem('cartItems'));
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    console.log('Parsed cart items:', cartItems);
    console.log('Number of items:', cartItems.length);
}

// Call debug function when page loads
document.addEventListener('DOMContentLoaded', function() {
    debugCart();
});


function processOrder() {
    // In a real app, this would send the order to the server and process payment
    // For demo purposes, we'll just simulate a successful order
    
    // Get order details
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const orderSummary = JSON.parse(localStorage.getItem('orderSummary')) || {};
    
    // Get customer details from form
    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    
    // Create order object
    const order = {
        id: Date.now(),
        items: cartItems,
        customer: {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: {
                street: formData.get('street'),
                city: formData.get('city'),
                province: formData.get('province'),
                postal: formData.get('postal')
            }
        },
        payment: {
            method: formData.get('payment-method'),
            cardNumber: formData.get('card-number') ? '****' + formData.get('card-number').slice(-4) : null
        },
        orderType: formData.get('order-type'),
        subtotal: orderSummary.subtotal,
        tax: orderSummary.tax,
        total: orderSummary.total,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    // Save order to localStorage (in a real app, this would be sent to a server)
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    localStorage.removeItem('cartItems');
    localStorage.removeItem('orderSummary');
    
    // Show order confirmation
    showOrderConfirmation(order);
}

function showOrderConfirmation(order) {
    // Redirect to confirmation page or show confirmation message
    const checkoutContainer = document.querySelector('.checkout-container');
    
    if (checkoutContainer) {
        // Create confirmation message
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'order-confirmation';
        
        confirmationDiv.innerHTML = `
            <div class="confirmation-icon">✓</div>
            <h2>Order Confirmed!</h2>
            <p>Thank you, ${order.customer.name}! Your order has been received.</p>
            <div class="order-details">
                <p><strong>Order Number:</strong> #${order.id}</p>
                <p><strong>Order Type:</strong> ${order.orderType}</p>
                <p><strong>Total:</strong> R${order.total.toFixed(2)}</p>
            </div>
            <p>A confirmation email has been sent to ${order.customer.email}.</p>
            <p>You can track your order status on your account page.</p>
            <a href="../index.html" class="btn primary-btn">Return to Home</a>
        `;
        
        // Hide checkout form and show confirmation
        checkoutContainer.innerHTML = '';
        checkoutContainer.appendChild(confirmationDiv);
        
        // Update cart count
        updateCartCount();
    }
}