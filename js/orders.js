// orders.js - Handles order-related functionality for Waffle Heaven

import { supabase } from './supabase.js';

// Function to create a new order
export async function createOrder(orderData) {
  try {
    // First, create the order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.userId,
        order_date: new Date(),
        status: 'received',
        delivery_method: orderData.deliveryMethod,
        delivery_address: orderData.deliveryAddress || null,
        contact_phone: orderData.contactPhone,
        payment_method: orderData.paymentMethod,
        special_instructions: orderData.specialInstructions || null,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        delivery_fee: orderData.deliveryFee || 0,
        total_amount: orderData.totalAmount
      }])
      .select();

    if (orderError) throw orderError;
    
    // Then, add all order items
    const orderItems = orderData.items.map(item => ({
      order_id: order[0].id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      customizations: item.customizations || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update customer loyalty points if they are logged in
    if (orderData.userId) {
      const pointsToAdd = Math.floor(orderData.totalAmount);
      const { error: userError } = await supabase.rpc('add_loyalty_points', { 
        user_id: orderData.userId, 
        points: pointsToAdd 
      });
      
      if (userError) console.error('Failed to update loyalty points:', userError);
    }

    return { success: true, orderId: order[0].id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

// Function to get an order by ID
export async function getOrderById(orderId) {
  try {
    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    
    // Get the order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        menu_items(*)
      `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;
    
    return { success: true, order: { ...order, items } };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: error.message };
  }
}

// Function to get orders for a specific user
export async function getUserOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false });

    if (error) throw error;
    
    return { success: true, orders: data };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { success: false, error: error.message };
  }
}

// Function to update order status (for staff)
export async function updateOrderStatus(orderId, status) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
}

// Function to cancel an order (for customers)
export async function cancelOrder(orderId) {
  try {
    // Check if the order is eligible for cancellation (only 'received' status)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();
      
    if (fetchError) throw fetchError;
    
    if (order.status !== 'received') {
      return { success: false, error: 'Only orders with "received" status can be cancelled' };
    }
    
    // Update the order status to 'cancelled'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error.message };
  }
}

// Function to get recent orders (for staff dashboard)
export async function getRecentOrders(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(first_name, last_name, email, phone)
      `)
      .order('order_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return { success: true, orders: data };
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return { success: false, error: error.message };
  }
}

// Function to get order statistics (for admin dashboard)
export async function getOrderStatistics(startDate, endDate) {
  try {
    const { data, error } = await supabase.rpc('get_order_statistics', {
      start_date: startDate,
      end_date: endDate
    });

    if (error) throw error;
    
    return { success: true, statistics: data };
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return { success: false, error: error.message };
  }
}