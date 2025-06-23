/**
 * Client-side JavaScript to handle form submissions
 * This file handles both contact form and newsletter form submissions
 * with proper validation and error handling
 */

document.addEventListener('DOMContentLoaded', function() {
  // Contact form submission handler
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validate form inputs before submission
      if (!validateForm()) {
        return false;
      }
      
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      
      // Update UI to show submission in progress
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;
      
      // Collect all form data into an object
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        newsletterSubscribe: document.getElementById('newsletter-subscribe').checked
      };
      
      try {
        // Send form data to serverless function
        const response = await fetch('/.netlify/functions/contact-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        // Handle success or error response
        if (response.ok) {
          showMessage('success', 'Thank you! Your message has been sent successfully.');
          contactForm.reset();
        } else {
          showMessage('error', result.message || 'There was a problem sending your message. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        showMessage('error', 'There was a problem sending your message. Please try again.');
      } finally {
        // Restore button state regardless of outcome
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
  
  // Newsletter subscription handler
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      if (!email) return;
      
      try {
        // Use dedicated endpoint for newsletter subscriptions
        const response = await fetch('/.netlify/functions/newsletter-subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showMessage('success', 'Thank you for subscribing!');
          this.reset();
        } else {
          showMessage('error', result.message || 'There was a problem with your subscription.');
        }
      } catch (error) {
        console.error('Error:', error);
        showMessage('error', 'There was a problem with your subscription.');
      }
    });
  }
  
  /**
   * Validates required form fields and email format
   * @returns {boolean} Whether the form is valid
   */
  function validateForm() {
    // Get essential form elements
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Ensure required fields are filled
    if (!name || !email || !message) {
      showMessage('error', 'Please fill out all required fields');
      return false;
    }
    
    // Validate email format using regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showMessage('error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  }
  
  /**
   * Displays a temporary message to the user
   * @param {string} type - 'success' or 'error'
   * @param {string} message - The message to display
   */
  function showMessage(type, message) {
    // Look for existing message container or create one
    let messageContainer = document.querySelector('.form-message');
    
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = 'form-message';
      contactForm.parentNode.insertBefore(messageContainer, contactForm.nextSibling);
    }
    
    // Update message content and styling
    messageContainer.textContent = message;
    messageContainer.className = `form-message ${type}`;
    
    // Ensure message is visible to user
    messageContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Auto-remove message after delay
    setTimeout(() => {
      messageContainer.remove();
    }, 5000);
  }
});
