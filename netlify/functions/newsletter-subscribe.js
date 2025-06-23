/**
 * Netlify Function to handle newsletter subscriptions
 * File path: netlify/functions/newsletter-subscribe.js
 * 
 * This function handles adding new subscribers to a newsletter database in Supabase.
 * It validates email addresses, checks for existing subscribers, and handles appropriate responses.
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
    
    // Validate email format using regex
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Valid email is required' })
      };
    }

    // Check if the email is already in our database
    const { data: existingSubscriber, error: lookupError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', data.email)
      .single();

    // If already subscribed, return early with appropriate message
    if (existingSubscriber) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'You are already subscribed to our newsletter!',
          data: existingSubscriber
        })
      };
    }

    // Insert new subscriber into the database
    const { data: insertData, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: data.email }]);

    // Handle database insertion errors
    if (error) {
      console.error('Error inserting newsletter subscriber:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error processing your subscription' })
      };
    }

    // Return success response when everything works
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'You have been successfully subscribed to our newsletter!',
        data: insertData
      })
    };
  } catch (error) {
    // Catch and log any unexpected errors
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
