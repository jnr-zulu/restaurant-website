// netlify/functions/create-order.js
const { createClient } = require('@supabase/supabase-js');

/**
 * Serverless function to create a new order in Supabase database
 * This handles CORS and provides appropriate error handling
 */

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Common headers for CORS support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: ''
    };
  }

  try {
    // Parse incoming request data
    const data = JSON.parse(event.body);
    
    // Save order to database and return the created record
    const { data: order, error } = await supabase
      .from('orders')
      .insert([data])
      .select();
    
    // Handle database errors
    if (error) throw error;
    
    // Return success response with created order
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, order })
    };
  } catch (error) {
    // Return formatted error response
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
