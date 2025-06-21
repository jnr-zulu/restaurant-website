// netlify/functions/sync-cart.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, cartItems } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Check if user has an existing cart
    const { data: existingCart, error: fetchError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(fetchError.message);
    }

    let result;
    
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

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        cart: result,
        message: 'Cart synchronized with database'
      })
    };
    
  } catch (error) {
    console.error('Cart sync error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};