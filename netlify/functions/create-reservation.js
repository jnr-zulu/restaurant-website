// /netlify/functions/create-reservation.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Ensure request method is POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    const { customer_name, email, phone, date, time, party_size, special_requests } = data;
    
    // Validate required fields
    if (!customer_name || !email || !date || !time || !party_size) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    // Create reservation in database
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
          status: 'pending'
        }
      ])
      .select();
    
    // Handle database errors
    if (error) {
      console.error('Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create reservation' })
      };
    }
    
    // Send confirmation email (commented out for now, implement with email service)
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
    
    // Return success response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        message: 'Reservation created successfully',
        reservation_id: reservation[0].id
      })
    };
    
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};