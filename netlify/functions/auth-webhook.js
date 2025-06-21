// functions/auth-webhook.js
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the incoming webhook payload
    const payload = JSON.parse(event.body);
    const { type, event: authEvent } = payload;

    // Handle different auth events
    if (type === 'AUTH' && authEvent === 'SIGNED_IN') {
      // User just signed in
      const { user } = payload;
      
      // Perform any custom actions needed on sign in
      console.log(`User ${user.id} signed in`);
      
      // You could update user records, send welcome emails, etc.
      
    } else if (type === 'AUTH' && authEvent === 'SIGNED_OUT') {
      // User just signed out
      const { user } = payload;
      console.log(`User ${user.id} signed out`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad request' }),
    };
  }
};
