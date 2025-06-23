// /netlify/functions/create-reservation.js
// This serverless function handles reservation creation for Waffle Heaven restaurant

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers to allow cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // API only accepts POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse and extract reservation details from request body
    const data = JSON.parse(event.body);
    const { customer_name, email, phone, date, time, party_size, special_requests } = data;
    
    // Validate that all required fields are present
    if (!customer_name || !email || !date || !time || !party_size) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // Insert new reservation record into Supabase database
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert([
        { 
          customer_name, 
          email, 
          phone, 
          reservation_date: date,
          reservation_time: time,
          party_size,
          special_requests,
          status: 'pending'  // All new reservations start with pending status
        }
      ])
      .select();
    
    // Handle any database errors during insertion
    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create reservation' })
      };
    }
    
    // TODO: Implement email confirmation service
    /*
    await sendConfirmationEmail({
      to: email,
      subject: 'Reservation Confirmation - Waffle Heaven',
      name: customer_name,
      date: date,
      time: time,
      party_size: party_size,
      confirmation_id: reservation[0].id
    });
    */
    
    // Return success response with the new reservation ID
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        message: 'Reservation created successfully',
        reservation_id: reservation[0].id
      })
    };
    
  } catch (err) {
    // Catch and log any unexpected errors
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
