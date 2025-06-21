// checkout.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Initialize Stripe
    const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY');
    const elements = stripe.elements();
    
    // Create and mount the Card Element
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                '::placeholder': {
                    color: '#aab7c4'
                }
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
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
    
    // Delivery method toggle
    const deliveryMethod = document.getElementById('delivery-method');
    const deliveryInfo = document.getElementById('delivery-info');
    const pickupInfo = document.getElementById('pickup-info');
    const deliveryFeeEl = document.getElementById('delivery-fee');
    
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
    
    // Load cart items from local storage
    loadCartItems();
    
    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        try {
            // Create payment method
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
            
            // Call Netlify Function to process payment and store order in Supabase
            const orderData = collectOrderData(paymentMethod.id);
            const response = await fetch('/.netlify/functions/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
    
    function collectOrderData(paymentMethodId) {
        // Get cart items
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        
        // Calculate totals
        const subtotal = calculateSubtotal(cartItems);
        const deliveryFee = deliveryMethod.value === 'delivery' ? 25 : 0;
        const tax = subtotal * 0.15;
        const total = subtotal + deliveryFee + tax;
        
        // Collect form data
        const formData = {
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
        
        return formData;
    }
    
    function loadCartItems() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountElement = document.getElementById('cart-count');
        
        // Update cart count
        cartCountElement.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
        
        // Clear loading message
        cartItemsContainer.innerHTML = '';
        
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }
        
        // Create HTML for cart items
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
    
    function calculateSubtotal(cartItems) {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    function updateOrderTotals() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const subtotal = calculateSubtotal(cartItems);
        const deliveryFee = deliveryMethod.value === 'delivery' ? 25 : 0;
        const tax = subtotal * 0.15;
        const total = subtotal + deliveryFee + tax;
        
        document.getElementById('subtotal-amount').textContent = `R${subtotal.toFixed(2)}`;
        document.getElementById('delivery-fee').textContent = `R${deliveryFee.toFixed(2)}`;
        document.getElementById('tax-amount').textContent = `R${tax.toFixed(2)}`;
        document.getElementById('total-amount').textContent = `R${total.toFixed(2)}`;
    }
    
    function handlePaymentError(error) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
        errorElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    function handleOrderSuccess(orderId) {
        // Hide the form
        document.getElementById('payment-form').style.display = 'none';
        
        // Show success message
        const successDiv = document.getElementById('order-success');
        successDiv.style.display = 'block';
        document.getElementById('order-reference').textContent = orderId;
        
        // Clear cart
        localStorage.removeItem('cartItems');
        
        // Scroll to success message
        successDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Check if user is logged in and prefill form
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
            
            // Update user menu
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
            // User is not logged in
            document.getElementById('user-menu').innerHTML = `
                <a href="login.html" class="login-link">Login</a>
                <a href="signup.html" class="signup-link">Sign Up</a>
            `;
        }
    }
    
    // Call auth check function
    checkAuthAndPrefillForm();
});
