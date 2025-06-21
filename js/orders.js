// orders.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart from localStorage or create empty cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Update cart count in header
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = itemCount;
        }
    }
    
    // Initialize cart count
    updateCartCount();
    
    // Add event listeners to add-to-cart buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const button = e.target;
            const id = button.dataset.id;
            const name = button.dataset.name;
            const price = parseFloat(button.dataset.price);
            const quantityInput = button.closest('.menu-item-content').querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value);
            
            addToCart(id, name, price, quantity);
        }
    });
    
    // Function to add items to cart
    function addToCart(id, name, price, quantity) {
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(item => item.id === id);
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.push({
                id,
                name,
                price,
                quantity
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Update cart preview
        updateCartPreview();
        
        // Show confirmation message
        alert(`${quantity} x ${name} added to cart!`);
    }
    
    // Function to update cart preview
    function updateCartPreview() {
        const cartPreviewItems = document.getElementById('cart-preview-items');
        const cartPreviewTotal = document.getElementById('cart-preview-total');
        
        if (cartPreviewItems) {
            if (cart.length === 0) {
                cartPreviewItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
            } else {
                cartPreviewItems.innerHTML = '';
                
                cart.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'cart-preview-item';
                    itemElement.innerHTML = `
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p>${item.quantity} x R${item.price.toFixed(2)}</p>
                        </div>
                        <div class="item-price">
                            R${(item.price * item.quantity).toFixed(2)}
                        </div>
                    `;
                    cartPreviewItems.appendChild(itemElement);
                });
            }
        }
        
        if (cartPreviewTotal) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartPreviewTotal.textContent = `R${total.toFixed(2)}`;
        }
    }
    
    // Initial update of cart preview
    updateCartPreview();
    
    // Handle quantity button clicks
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const button = e.target;
            const input = button.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (button.classList.contains('decrease')) {
                value = value > 1 ? value - 1 : 1;
            } else if (button.classList.contains('increase')) {
                value = value + 1;
            }
            
            input.value = value;
        }
    });
    
    // Handle checkout process
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            try {
                // Get order information
                const orderType = document.getElementById('delivery-option').classList.contains('active') 
                    ? 'delivery' 
                    : 'pickup';
                
                let deliveryInfo = null;
                if (orderType === 'delivery') {
                    deliveryInfo = {
                        street: document.getElementById('street').value,
                        city: document.getElementById('city').value,
                        province: document.getElementById('province').value,
                        postal_code: document.getElementById('postal').value,
                        delivery_notes: document.getElementById('delivery-notes').value
                    };
                }
                
                const orderData = {
                    items: cart,
                    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    order_type: orderType,
                    delivery_info: deliveryInfo,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                
                // Save order to Supabase
                const savedOrder = await saveOrder(orderData);
                
                // Clear cart after successful order
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                updateCartPreview();
                
                // Redirect to confirmation page
                window.location.href = `order-confirmation.html?order_id=${savedOrder.id}`;
            } catch (error) {
                console.error('Error processing order:', error);
                alert('There was an error processing your order. Please try again.');
            }
        });
    }
});
