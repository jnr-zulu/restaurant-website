// Initialize Supabase client
const SUPABASE_URL = 'https://fweirplinqihuukrpvqd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg'; 

// For production, these should come from environment variables
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);