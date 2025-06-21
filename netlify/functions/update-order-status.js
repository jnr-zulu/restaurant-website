// netlify/functions/update-order-status.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { orderId, newStatus } = requestBody;
    
    // Validate request parameters
    if (!orderId || !newStatus) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: orderId and newStatus' })
      };
    }

    // Verify authorization
    const authHeader = event.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - Authentication required' })
      };
    }

    // Verify JWT token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - Invalid token' })
      };
    }

    // Check if user has staff role
    if (!decodedToken.roles || !decodedToken.roles.includes('staff')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden - Staff access required' })
      };
    }

    // Validate status value
    const validStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid status value', 
          validValues: validStatuses 
        })
      };
    }

    // Update order status in Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus, 
        updated_at: new Date(),
        updated_by: decodedToken.userId 
      })
      .eq('id', orderId)
      .select();

    if (orderError) {
      throw new Error(`Error updating order: ${orderError.message}`);
    }

    // Check if order was found and updated
    if (!orderData || orderData.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Order not found' })
      };
    }

    // Add status update to order history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: newStatus,
        changed_by: decodedToken.userId,
        changed_at: new Date()
      });

    if (historyError) {
      console.error('Error adding to order history:', historyError);
      // Continue execution even if history update fails
    }

    // If order is completed or cancelled, handle any additional logic
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      // For completed orders, update customer loyalty points
      if (newStatus === 'completed') {
        // Get order details
        const { data: orderDetails } = await supabase
          .from('orders')
          .select('customer_id, total_amount')
          .eq('id', orderId)
          .single();
        
        if (orderDetails && orderDetails.customer_id) {
          // Add loyalty points (1 point per $10 spent)
          const pointsToAdd = Math.floor(orderDetails.total_amount / 10);
          
          const { error: loyaltyError } = await supabase
            .from('customers')
            .update({ 
              loyalty_points: supabase.rpc('increment_points', { points: pointsToAdd }) 
            })
            .eq('id', orderDetails.customer_id);
            
          if (loyaltyError) {
            console.error('Error updating loyalty points:', loyaltyError);
          }
        }
      }
    }

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: `Order status updated to ${newStatus}`,
        orderId,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Error updating order status:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};