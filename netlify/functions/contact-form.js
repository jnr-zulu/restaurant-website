// Netlify Function to handle contact form submissions
// File path: netlify/functions/contact-form.js

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
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Name, email, and message are required' })
      };
    }

    // Insert data into Supabase
    const { data: insertData, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          subject: data.subject,
          message: data.message,
          newsletter_subscribe: data.newsletterSubscribe || false
        }
      ]);

    if (error) {
      console.error('Error inserting contact message:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error saving your message' })
      };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Your message has been sent successfully!',
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
