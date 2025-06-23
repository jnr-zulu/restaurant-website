/**
 * Serverless function to update order status in the restaurant ordering system
 * 
 * This function:
 * - Validates user authentication and authorization
 * - Updates order status in the database
 * - Records status changes in order history
 * - Manages loyalty points for completed orders
 */

// netlify/functions/update-order-status.js
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Valid order statuses
const VALID_STATUSES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

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
    return { statusCode: 204, headers };
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

    // Authenticate user
    const decodedToken = await authenticateUser(event.headers.authorization, headers);
    if (!decodedToken.success) {
      return decodedToken.response;
    }

    // Validate status value
    if (!VALID_STATUSES.includes(newStatus)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid status value', 
          validValues: VALID_STATUSES 
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

    // Record status change in history
    await recordStatusChange(orderId, newStatus, decodedToken.userId);

    // Handle post-update actions (loyalty points, etc.)
    if (newStatus === 'completed') {
      await processCompletedOrder(orderId);
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

/**
 * Authenticate and authorize the user
 * @param {string} authHeader - Authorization header
 * @param {object} headers - Response headers
 * @returns {object} Authentication result
 */
async function authenticateUser(authHeader, headers) {
  // Extract token
  authHeader = authHeader || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return {
      success: false,
      response: {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - Authentication required' })
      }
    };
  }

  // Verify JWT token
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has staff role
    if (!decodedToken.roles || !decodedToken.roles.includes('staff')) {
      return {
        success: false,
        response: {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Forbidden - Staff access required' })
        }
      };
    }
    
    return { success: true, userId: decodedToken.userId };
  } catch (error) {
    return {
      success: false,
      response: {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - Invalid token' })
      }
    };
  }
}

/**
 * Record status change in order history
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {string} userId - User who changed the status
 */
async function recordStatusChange(orderId, status, userId) {
  const { error } = await supabase
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status,
      changed_by: userId,
      changed_at: new Date()
    });

  if (error) {
    console.error('Error adding to order history:', error);
    // Continue execution even if history update fails
  }
}

/**
 * Process completed order (add loyalty points)
 * @param {string} orderId - Order ID
 */
async function processCompletedOrder(orderId) {
  // Get order details
  const { data: orderDetails } = await supabase
    .from('orders')
    .select('customer_id, total_amount')
    .eq('id', orderId)
    .single();
  
  if (orderDetails && orderDetails.customer_id) {
    // Add loyalty points (1 point per $10 spent)
    const pointsToAdd = Math.floor(orderDetails.total_amount / 10);
    
    const { error } = await supabase
      .from('customers')
      .update({ 
        loyalty_points: supabase.rpc('increment_points', { points: pointsToAdd }) 
      })
      .eq('id', orderDetails.customer_id);
      
    if (error) {
      console.error('Error updating loyalty points:', error);
    }
  }
}
