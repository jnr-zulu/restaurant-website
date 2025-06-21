// Create auth.js in your js folder
// Initialize Supabase client
const supabaseUrl = 'https://fweirplinqihuukrpvqd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Handle user authentication state
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // User is signed in
    document.querySelectorAll('.logged-out').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.logged-in').forEach(el => el.style.display = 'block');
    
    // Fetch user profile if needed
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profile) {
      // Update UI with user data
      if (document.getElementById('user-name')) {
        document.getElementById('user-name').textContent = profile.full_name || user.email;
      }
    }
  } else {
    // No user signed in
    document.querySelectorAll('.logged-out').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.logged-in').forEach(el => el.style.display = 'none');
  }
}

// Functions for authentication
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function checkAuthState() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Check user status when page loads
document.addEventListener('DOMContentLoaded', checkUser);
