// checkout.js - E-commerce checkout system with Supabase and Stripe integration
document.addEventListener('DOMContentLoaded', function() {
    // === INITIALIZATION ===
    // Initialize Supabase client
    const supabaseUrl = 'https://fweirplinqihuukrpvqd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Initialize Stripe
    const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY');
    const elements = stripe.elements();
    
    // === UI ELEMENTS ===
    const deliveryMethod = document.getElementById('delivery-method');
    const deliveryInfo = document.getElementById('delivery-info');
    const pickupInfo = document.getElementById('pickup-info');
    const deliveryFeeEl = document.getElementById('delivery-fee');
    const form = document.getElementById('payment-form');
    
    // === STRIPE SETUP ===
    // Create and mount the Card Element with styled UI
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                '::placeholder': { color: '#aab7c4' }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        }
    });
    
    cardElement.mount('#card-element');
    
    // Handle realtime validation errors on the card Element
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        displayError.textContent = event.error ? event.error.message : '';
    });
    
    // === EVENT LISTENERS ===
    // Toggle between delivery and pickup options
    deliveryMethod.addEventListener('change', function() {
        if (this.value === 'delivery') {
            deliveryInfo.style.display = 'block';
            pickupInfo.style.display = 'none';
            deliveryFeeEl.textContent = 'R25.00';
        } else {
            deliveryInfo.style.display = 'none';
            pickupInfo.style.display = 'block';
            deliveryFeeEl.textContent = 'R0.00';
        }
        updateOrderTotals();
    });
    
    // Handle form submission with payment processing
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        try {
            // Create payment method with Stripe
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value
                }
            });
            
            if (error) {
                handlePaymentError(error);
                return;
            }
            
            // Process payment via serverless function
            const orderData = collectOrderData(paymentMethod.id);
            const response = await fetch('/.netlify/functions/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                handleOrderSuccess(result.orderId);
            } else {
                handlePaymentError({ message: result.error || 'Payment failed. Please try again.' });
            }
        } catch (err) {
            handlePaymentError({ message: 'An unexpected error occurred. Please try again.' });
            console.error('Error:', err);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
        }
    });
    
    // === HELPER FUNCTIONS ===
    // Initialize the checkout page
    function init() {
        loadCartItems();
        checkAuthAndPrefillForm();
    }
    
    // Collect all order data for submission
    function collectOrderData(paymentMethodId) {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        
        // Calculate financial totals
        const subtotal = calculateSubtotal(cartItems);
        const deliveryFee = deliveryMethod.value === 'delivery' ? 25 : 0;
        const tax = subtotal * 0.15;
        const total = subtotal + deliveryFee + tax;
        
        return {
            customer: {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            },
            deliveryMethod: deliveryMethod.value,
            deliveryInfo: deliveryMethod.value === 'delivery' ? {
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postal-code').value,
                notes: document.getElementById('delivery-notes').value
            } : null,
            order: {
                items: cartItems,
                subtotal,
                deliveryFee,
                tax,
                total
            },
            payment: {
                paymentMethodId
            }
        };
    }
    
    // Load and display cart items from localStorage
    function loadCartItems() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountElement = document.getElementById('cart-count');
        
        // Update cart count
        cartCountElement.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
        
        // Clear container and show empty message if needed
        cartItemsContainer.innerHTML = '';
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }
        
        // Render each cart item
        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p>${item.quantity} x R${item.price.toFixed(2)}</p>
                </div>
                <div class="item-price">
                    R${(item.price * item.quantity).toFixed(2)}
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        
        updateOrderTotals();
    }
    
    // Calculate cart subtotal
    function calculateSubtotal(cartItems) {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Update order summary totals
    function updateOrderTotals() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const subtotal = calculateSubtotal(cartItems);
        const deliveryFee = deliveryMethod.value === 'delivery' ? 25 : 0;
        const tax = subtotal * 0.15;
        const total = subtotal + deliveryFee + tax;
        
        // Update display elements
        document.getElementById('subtotal-amount').textContent = `R${subtotal.toFixed(2)}`;
        document.getElementById('delivery-fee').textContent = `R${deliveryFee.toFixed(2)}`;
        document.getElementById('tax-amount').textContent = `R${tax.toFixed(2)}`;
        document.getElementById('total-amount').textContent = `R${total.toFixed(2)}`;
    }
    
    // Handle payment errors
    function handlePaymentError(error) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
        errorElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Handle successful order completion
    function handleOrderSuccess(orderId) {
        // Hide form and show success message
        document.getElementById('payment-form').style.display = 'none';
        const successDiv = document.getElementById('order-success');
        successDiv.style.display = 'block';
        document.getElementById('order-reference').textContent = orderId;
        
        // Clear cart and scroll to success message
        localStorage.removeItem('cartItems');
        successDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Check authentication status and prefill form if logged in
    async function checkAuthAndPrefillForm() {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // Get user profile from Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
            if (data && !error) {
                // Prefill form with user data
                document.getElementById('name').value = `${data.first_name} ${data.last_name}`;
                document.getElementById('email').value = data.email;
                document.getElementById('phone').value = data.phone || '';
                
                if (data.address) {
                    document.getElementById('address').value = data.address;
                    document.getElementById('city').value = data.city || '';
                    document.getElementById('postal-code').value = data.postal_code || '';
                }
            }
            
            // Update user menu for logged-in state
            document.getElementById('user-menu').innerHTML = `
                <a href="account.html" class="account-link">My Account</a>
                <button id="logout-button" class="logout-button">Logout</button>
            `;
            
            // Add logout functionality
            document.getElementById('logout-button').addEventListener('click', async () => {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            });
        } else {
            // Show login/signup options for logged-out state
            document.getElementById('user-menu').innerHTML = `
                <a href="login.html" class="login-link">Login</a>
                <a href="signup.html" class="signup-link">Sign Up</a>
            `;
        }
    }
    
    // Initialize the page
    init();
});
