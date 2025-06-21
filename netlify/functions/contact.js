// Client-side JavaScript to handle form submission with Supabase
// Modify the contact.js file

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validate form
      if (!validateForm()) {
        return false;
      }
      
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      
      // Change button text and disable it
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;
      
      // Collect form data
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        newsletterSubscribe: document.getElementById('newsletter-subscribe').checked
      };
      
      try {
        // Send data to Netlify function
        const response = await fetch('/.netlify/functions/contact-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Show success message
          showMessage('success', 'Thank you! Your message has been sent successfully.');
          contactForm.reset();
        } else {
          // Show error message
          showMessage('error', result.message || 'There was a problem sending your message. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        showMessage('error', 'There was a problem sending your message. Please try again.');
      } finally {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
  
  // Newsletter form submission
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      if (!email) return;
      
      try {
        // Send to a different Netlify function for newsletter subscriptions
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
  
  // Form validation function
  function validateForm() {
    // Get form elements
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Basic validation
    if (!name || !email || !message) {
      showMessage('error', 'Please fill out all required fields');
      return false;
    }
    
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showMessage('error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  }
  
  // Function to show messages to the user
  function showMessage(type, message) {
    // Check if a message container already exists
    let messageContainer = document.querySelector('.form-message');
    
    // If not, create one
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = 'form-message';
      contactForm.parentNode.insertBefore(messageContainer, contactForm.nextSibling);
    }
    
    // Set the message and type
    messageContainer.textContent = message;
    messageContainer.className = `form-message ${type}`;
    
    // Scroll to the message
    messageContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Automatically remove the message after 5 seconds
    setTimeout(() => {
      messageContainer.remove();
    }, 5000);
  }
});
