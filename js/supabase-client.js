// Initialize Supabase client
const SUPABASE_URL = 'https://fweirplinqihuukrpvqd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg'; 

// For production, these should come from environment variables
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to fetch menu items from Supabase
async function fetchMenuItems() {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select('*');
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return [];
    }
}

// Function to save order to Supabase
async function saveOrder(orderData) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Error saving order:', error);
        throw error;
    }
}

// Function to save delivery address to Supabase
async function saveDeliveryAddress(addressData) {
    try {
        const { data, error } = await supabase
            .from('delivery_addresses')
            .insert([addressData])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Error saving delivery address:', error);
        throw error;
    }
}
