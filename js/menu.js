/**
 * Initialize all functionality when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize menu functionality
    initializeMenu();
    
    // Setup add to cart buttons
    setupAddToCartButtons();
    
    // Setup category navigation highlighting
    setupCategoryNavigation();
    
    // Setup quantity selectors if on order-online page
    setupQuantitySelectors();
});

/**
 * Initialize the menu components
 * Could be expanded to load menu items dynamically
 */
function initializeMenu() {
    // Currently using static HTML, but could load from API in future
    console.log('Menu initialized');
}

/**
 * Setup event listeners for add to cart buttons
 * Retrieves item details and adds them to the cart
 */
function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const price = parseFloat(this.getAttribute('data-price')); // Price in Rands
            
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

/**
 * Setup category navigation with smooth scrolling and highlighting
 */
function setupCategoryNavigation() {
    const categoryLinks = document.querySelectorAll('.category-nav a');
    
    // Highlight active category based on scroll position
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.menu-section');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Note: sectionHeight is defined but not used - could be removed
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= (sectionTop - 150)) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // Update active class on navigation links
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
                const offsetTop = targetSection.offsetTop - 120; // Offset for header
                
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
 * Setup quantity selectors with increment/decrement functionality
 */
function setupQuantitySelectors() {
    const quantityControls = document.querySelectorAll('.quantity-controls');
    
    quantityControls.forEach(control => {
        const decreaseBtn = control.querySelector('.decrease');
        const increaseBtn = control.querySelector('.increase');
        const input = control.parentElement.querySelector('.quantity-input');
        
        if (decreaseBtn && increaseBtn && input) {
            // Decrease quantity (minimum: 1)
            decreaseBtn.addEventListener('click', function() {
                let value = parseInt(input.value);
                if (value > 1) {
                    input.value = value - 1;
                }
            });
            
            // Increase quantity
            increaseBtn.addEventListener('click', function() {
                let value = parseInt(input.value);
                input.value = value + 1;
            });
            
            // Validate manual input (ensure it's at least 1)
            input.addEventListener('change', function() {
                let value = parseInt(this.value);
                if (value < 1 || isNaN(value)) {
                    this.value = 1;
                }
            });
        }
    });
}
