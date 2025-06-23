/**
 * Supabase Client Configuration
 * Initialize the connection to our Supabase backend
 * NOTE: In production, these values should be stored in environment variables
 */
const SUPABASE_URL = 'https://fweirplinqihuukrpvqd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWlycGxpbnFpaHV1a3JwdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDcwMTcsImV4cCI6MjA2NjAyMzAxN30.mP0RBD7F5vpfjmp4f7tI3VG3d40PG3lzAXuEHe_ALxg'; 

// Create Supabase client instance
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches all menu items from the database
 * @returns {Array} Array of menu items or empty array if error
 */
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

/**
 * Saves a customer order to the database
 * @param {Object} orderData - Order information to be saved
 * @returns {Object} The saved order with generated ID
 */
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

/**
 * Saves a delivery address to the database
 * In production: Saves to delivery_addresses table
 * In development: Returns mock data without DB insertion
 * @param {Object} addressData - Address information to save
 * @returns {Object} The saved address with generated ID
 */
async function saveDeliveryAddress(addressData) {
    // Development mode check can be added here
    if (process.env.NODE_ENV === 'development') {
        console.log('Saving address (dev mode):', addressData);
        return { id: 1, ...addressData };
    }
    
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
