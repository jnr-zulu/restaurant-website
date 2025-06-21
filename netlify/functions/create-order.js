// netlify/functions/create-orders.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.customer_id || !data.items || !data.total) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create the order in the database
    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: data.customer_id,
          items: data.items,
          total: data.total,
          status: 'pending',
          delivery_address: data.delivery_address,
          payment_method: data.payment_method,
          special_instructions: data.special_instructions || null
        }
      ])
      .select();

    if (error) throw error;

    // Create order items in a separate table if needed
    if (data.items && Array.isArray(data.items)) {
      const orderItems = data.items.map(item => ({
        order_id: order[0].id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }

    // Return success response with the created order
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Order created successfully',
        order: order[0]
      })
    };
  } catch (error) {
    console.error('Error creating order:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};