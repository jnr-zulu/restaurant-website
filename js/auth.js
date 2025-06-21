// Create auth.js in your js folder
// Initialize Supabase client
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-supabase-anon-key';
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

// Check user status when page loads
document.addEventListener('DOMContentLoaded', checkUser);
