// netlify/functions/sync-cart.js
// This serverless function synchronizes a user's cart with the database
// It either creates a new cart or updates an existing one

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Extract user ID and cart items from request body
    const { userId, cartItems } = JSON.parse(event.body);

    // Validate required fields
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Check if user has an existing cart
    // PGRST116 is the "no rows returned" error code
    const { data: existingCart, error: fetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(fetchError.message);
    }

    let result;
    
    // Handle cart update or creation based on whether it already exists
    if (existingCart) {
      // Update existing cart
      const { data, error } = await supabase
        .from('carts')
        .update({ items: cartItems, updated_at: new Date() })
        .eq('user_id', userId)
        .select();
        
      if (error) throw new Error(error.message);
      result = data;
    } else {
      // Create new cart
      const { data, error } = await supabase
        .from('carts')
        .insert([{ user_id: userId, items: cartItems }])
        .select();
        
      if (error) throw new Error(error.message);
      result = data;
    }

    // Return success response with cart data
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        cart: result,
        message: 'Cart synchronized with database'
      })
    };
    
  } catch (error) {
    // Log and return error response
    console.error('Cart sync error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
