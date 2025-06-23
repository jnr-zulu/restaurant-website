/**
 * Main e-commerce website JavaScript
 * Handles navigation, shopping cart, user account, and UI interactions
 */

// Wait for the DOM to load completely
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    initializeMobileNav();
    
    // Newsletter Form Submission
    initializeNewsletterForm();
    
    // Load cart count from localStorage
    updateCartCount();
    
    // Account dropdown functionality
    initializeAccountDropdown();
    
    // Initialize menu functionality (if on menu page)
    initializeMenu();
    
    // Setup add to cart buttons
    setupAddToCartButtons();
    
    // Setup category navigation highlighting
    setupCategoryNavigation();
    
    // Setup quantity selectors if on order-online page
    setupQuantitySelectors();
});

/**
 * Mobile Navigation Functions
 */
function initializeMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            
            // Animate hamburger to X
            hamburger.classList.toggle('toggle');
            
            // Animation for hamburger
            const lines = hamburger.querySelectorAll('div');
            if (hamburger.classList.contains('toggle')) {
                lines[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                lines[1].style.opacity = '0';
                lines[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
            }
        });
    }
    
    // Close mobile nav when clicking anywhere outside
    document.addEventListener('click', (event) => {
        if (navLinks && navLinks.classList.contains('nav-active') && 
            !event.target.closest('nav')) {
            navLinks.classList.remove('nav-active');
            
            // Reset hamburger
            if (hamburger && hamburger.classList.contains('toggle')) {
                hamburger.classList.remove('toggle');
                const lines = hamburger.querySelectorAll('div');
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
            }
        }
    });
}

/**
 * Newsletter Form Functions
 */
function initializeNewsletterForm() {
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            alert(`Thank you for subscribing with ${email}! You'll receive our latest news and offers.`);
            this.reset();
        });
    }
}

/**
 * Account Functions
 */
function initializeAccountDropdown() {
    const accountLink = document.getElementById('account-link');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (accountLink && dropdownContent) {
        // Check if user is logged in (using localStorage for demo)
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // Change account link text
            accountLink.textContent = 'My Account';
            
            // Clear dropdown content and add logged-in options
            dropdownContent.innerHTML = '';
            
            const profileLink = document.createElement('a');
            profileLink.href = 'pages/profile.html';
            profileLink.textContent = 'Profile';
            
            const ordersLink = document.createElement('a');
            ordersLink.href = 'pages/orders.html';
            ordersLink.textContent = 'My Orders';
            
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.textContent = 'Logout';
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                // Clear login state
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                
                // Redirect to home page
                window.location.href = 'index.html';
            });
            
            dropdownContent.appendChild(profileLink);
            dropdownContent.appendChild(ordersLink);
            dropdownContent.appendChild(logoutLink);
        }
    }
}

/**
 * Cart Functions
 */

// Function to update cart count
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        let totalItems = 0;
        
        if (Array.isArray(cartItems)) {
            totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        }
        
        cartCountElement.textContent = totalItems;
    }
}

// Add to cart function - consolidated version
function addToCart(itemId, name, price, quantity = 1) {
    // Get existing cart items from localStorage
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.id == itemId);
    
    if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        // Add new item to cart
        cartItems.push({
            id: itemId,
            name: name,
            price: parseFloat(price),
            quantity: quantity
        });
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Update cart count in the UI
    updateCartCount();
    
    // Show feedback to user
    showAddToCartFeedback(name);
}

// Remove from cart function
function removeFromCart(itemId) {
    // Get existing cart items from localStorage
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Filter out the item to be removed
    cartItems = cartItems.filter(item => item.id !== itemId);
    
    // Save updated cart to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // Update cart count in the UI
    updateCartCount();
    
    // Refresh cart page if we're on it
    if (window.location.href.includes('cart.html')) {
        displayCartItems();
        updateCartTotal();
    }
}

/**
 * Menu Page Functions
 */
function initializeMenu() {
    // Could load menu items dynamically from an API here
    // For now, we're using static HTML
    console.log('Menu initialized');
}

function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const price = parseFloat(this.getAttribute('data-price'));
            
            // Get quantity if available (for order-online page)
            let quantity = 1;
            const quantityInput = this.closest('.menu-item').querySelector('.quantity-input');
            if (quantityInput) {
                quantity = parseInt(quantityInput.value);
            }
            
            // Add to cart
            addToCart(itemId, name, price, quantity);
        });
    });
}

function setupCategoryNavigation() {
    const categoryLinks = document.querySelectorAll('.category-nav a');
    
    // Highlight active category based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.menu-section');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= (sectionTop - 150)) {
                currentSection = section.getAttribute('id');
            }
        });
        
        categoryLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Smooth scroll to category when clicking navigation links
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 120;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update active class
                categoryLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

/**
 * Product Quantity Controls
 */
function setupQuantitySelectors() {
    const quantityControls = document.querySelectorAll('.quantity-controls');
    
    quantityControls.forEach(control => {
        const decreaseBtn = control.querySelector('.decrease');
        const increaseBtn = control.querySelector('.increase');
        const input = control.parentElement.querySelector('.quantity-input');
        
        if (decreaseBtn && increaseBtn && input) {
            decreaseBtn.addEventListener('click', function() {
                let value = parseInt(input.value);
                if (value > 1) {
                    input.value = value - 1;
                }
            });
            
            increaseBtn.addEventListener('click', function() {
                let value = parseInt(input.value);
                input.value = value + 1;
            });
            
            input.addEventListener('change', function() {
                let value = parseInt(this.value);
                if (value < 1 || isNaN(value)) {
                    this.value = 1;
                }
            });
        }
    });
}

/**
 * UI Feedback Functions
 */
function showAddToCartFeedback(itemName) {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = 'cart-feedback';
    feedback.textContent = `${itemName} added to cart!`;
    
    // Add to document
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        feedback.classList.add('show');
        
        setTimeout(() => {
            feedback.classList.remove('show');
            
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 2000);
    }, 10);
}
