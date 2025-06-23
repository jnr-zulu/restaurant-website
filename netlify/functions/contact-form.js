/**
 * Netlify Function to handle contact form submissions
 * File path: netlify/functions/contact-form.js
 * 
 * This serverless function processes form submissions and stores them in Supabase.
 * It validates required fields and returns appropriate status codes.
 */

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
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Name, email, and message are required' })
      };
    }

    // Insert data into Supabase 'contact_messages' table
    const { data: insertData, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone || null, // Optional field
          subject: data.subject,
          message: data.message,
          newsletter_subscribe: data.newsletterSubscribe || false // Optional subscription flag
        }
      ]);

    // Handle database errors
    if (error) {
      console.error('Error inserting contact message:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error saving your message' })
      };
    }

    // Return success response with data
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Your message has been sent successfully!',
        data: insertData
      })
    };
  } catch (error) {
    // Handle unexpected errors
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
