/**
 * auth.js - Supabase Authentication Module
 * 
 * This file handles user authentication with Supabase, including:
 * - Client initialization
 * - User state management
 * - UI updates based on authentication status
 * - Profile data retrieval
 */

// Initialize Supabase client
const supabaseUrl = 'https://fweirplinqihuukrpvqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

/**
 * Check user authentication status and update UI accordingly
 * - Shows/hides elements based on login state
 * - Fetches and displays user profile information when logged in
 */
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // User is signed in - update UI elements
    document.querySelectorAll('.logged-out').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.logged-in').forEach(el => el.style.display = 'block');
    
    // Fetch user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    // Update UI with profile information if available
    if (profile && document.getElementById('user-name')) {
      document.getElementById('user-name').textContent = profile.full_name || user.email;
    }
  } else {
    // No user signed in - update UI elements
    document.querySelectorAll('.logged-out').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.logged-in').forEach(el => el.style.display = 'none');
  }
}

/**
 * Get current authenticated user
 * @returns {Object} The current user object or null
 */
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Initialize authentication check when page loads
document.addEventListener('DOMContentLoaded', checkUser);
