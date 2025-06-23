// netlify/functions/cart-operations.js
/**
 * Serverless function to handle cart operations
 * This function supports operations like item validation and consolidation
 * @author Patrick-Jnr Zulu
 * @date 2025-06-23
 */

const { handler } = require('@netlify/functions');

exports.handler = async (event, context) => {
  // Only allow POST requests for security reasons
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming request body to get operation details
    const data = JSON.parse(event.body);
    const { operation, cartItems } = data;

    // Handle different cart operations using switch-case for extensibility
    switch (operation) {
      case 'validate':
        // Consolidate items to prevent duplicates in the cart
        // This improves user experience by showing quantity instead of repeated items
        const consolidatedCart = consolidateCartItems(cartItems);
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            cartItems: consolidatedCart,
            message: 'Cart validated and consolidated'
          })
        };
        
      default:
        // Return error for unsupported operations
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid operation' })
        };
    }
  } catch (error) {
    // Log error for debugging and return friendly message to user
    console.error('Cart operation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Consolidates duplicate items in cart by combining quantities
 * @param {Array} cartItems - Array of cart items
 * @returns {Array} - Consolidated array with no duplicates
 */
function consolidateCartItems(cartItems) {
  // Use Map for O(1) lookups by item ID
  const itemMap = new Map();
  
  // Process each item and consolidate based on ID
  cartItems.forEach(item => {
    if (itemMap.has(item.id)) {
      // For existing items, increment quantity
      const existingItem = itemMap.get(item.id);
      existingItem.quantity += item.quantity;
    } else {
      // For new items, add to map with spread to avoid reference issues
      itemMap.set(item.id, { ...item });
    }
  });
  
  // Convert map back to array for response
  return Array.from(itemMap.values());
}
