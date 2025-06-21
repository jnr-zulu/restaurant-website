// netlify/functions/cart-operations.js
const { handler } = require('@netlify/functions');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { operation, cartItems } = data;

    // Handle different cart operations
    switch (operation) {
      case 'validate':
        // This function consolidates duplicate items instead of having them as separate entries
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
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid operation' })
        };
    }
  } catch (error) {
    console.error('Cart operation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Function to consolidate duplicate items in cart
function consolidateCartItems(cartItems) {
  const itemMap = new Map();
  
  // Group items by ID
  cartItems.forEach(item => {
    if (itemMap.has(item.id)) {
      // If item already exists, increase quantity
      const existingItem = itemMap.get(item.id);
      existingItem.quantity += item.quantity;
    } else {
      // Otherwise add new item to map
      itemMap.set(item.id, { ...item });
    }
  });
  
  // Convert map back to array
  return Array.from(itemMap.values());
}
