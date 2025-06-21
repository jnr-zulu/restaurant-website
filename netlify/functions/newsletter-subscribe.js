// Netlify Function to handle newsletter subscriptions
// File path: netlify/functions/newsletter-subscribe.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
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
    
    // Validate email
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Valid email is required' })
      };
    }

    // Check if already subscribed
    const { data: existingSubscriber, error: lookupError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', data.email)
      .single();

    if (existingSubscriber) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'You are already subscribed to our newsletter!',
          data: existingSubscriber
        })
      };
    }

    // Insert new subscriber
    const { data: insertData, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: data.email }]);

    if (error) {
      console.error('Error inserting newsletter subscriber:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error processing your subscription' })
      };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'You have been successfully subscribed to our newsletter!',
        data: insertData
      })
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
