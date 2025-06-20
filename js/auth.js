// js/auth.js - Main authentication handler
class AuthHandler {
  constructor() {
    this.supabaseUrl = 'postgresql://postgres:[YOUR-PASSWORD]@db.fweirplinqihuukrpvqd.supabase.co:5432/postgres';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg'; 
    this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Login user
  async login(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        throw error;
      }

      // Get user profile data
      const userProfile = await this.getUserProfile(data.user.id);
      
      // Store user data in localStorage
      const userData = {
        user_id: data.user.id,
        email: data.user.email,
        full_name: userProfile?.full_name || '',
        phone: userProfile?.phone || '',
        role: userProfile?.role || 'customer',
        created_at: data.user.created_at
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('supabaseSession', JSON.stringify(data.session));

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user profile from users table
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Register new user
  async register(userData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        throw authError;
      }

      // Create user profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('users')
        .insert([{
          user_id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: 'customer'
        }])
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      return { success: true, user: authData.user, profile: profileData };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear local storage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('supabaseSession');

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    const user = localStorage.getItem('currentUser');
    const session = localStorage.getItem('supabaseSession');
    return user && session;
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Initialize auth state listener
  initAuthListener() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('supabaseSession');
        window.location.href = 'login.html';
      }
    });
  }
}

// js/login.js - Login page specific code
document.addEventListener('DOMContentLoaded', function() {
  const authHandler = new AuthHandler();
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.querySelector('button[type="submit"]');

  // Check if user is already logged in
  if (authHandler.isLoggedIn()) {
    const user = authHandler.getCurrentUser();
    if (user.role === 'admin' || user.role === 'staff') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
    return;
  }

  // Handle form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    // Validate input
    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';

    try {
      // Attempt login
      const result = await authHandler.login(email, password);

      if (result.success) {
        showSuccess('Login successful! Redirecting...');
        
        // Redirect based on user role
        setTimeout(() => {
          if (result.user.role === 'admin' || result.user.role === 'staff') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 1000);
      } else {
        showError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Login';
    }
  });

  // Email validation function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Show error message
  function showError(message) {
    showNotification(message, 'error');
  }

  // Show success message
  function showSuccess(message) {
    showNotification(message, 'success');
  }

  // Show notification
  function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
});

// CSS for loading spinner (add to your CSS file)
const loadingSpinnerCSS = `
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.notification {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;