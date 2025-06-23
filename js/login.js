/**
 * Login functionality for Supabase authentication
 * This script handles user login and redirects based on user roles
 */

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form values
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const rememberMe = document.getElementById('remember-me').checked;
      
      try {
        // Sign in user with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
          options: {
            // Set session duration based on "remember me" checkbox
            expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 1 * 60 * 60 // 30 days or 1 hour
          }
        });
        
        // Handle authentication errors
        if (error) throw error;
        
        // Notify user of successful login
        alert('Login successful!');
        
        // Fetch user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        // Redirect based on user role
        if (profile && profile.role === 'admin') {
          window.location.href = 'admin/dashboard.html';
        } else if (profile && profile.role === 'staff') {
          window.location.href = 'staff/dashboard.html';
        } else {
          window.location.href = '../index.html'; // Customer redirect
        }
        
      } catch (error) {
        // Handle and display login errors
        alert('Error logging in: ' + error.message);
        console.error('Login error:', error);
      }
    });
  }
});
