// netlify/functions/process-payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Successful preflight call' })
        };
    }
    
    try {
        const data = JSON.parse(event.body);
        const { customer, deliveryMethod, deliveryInfo, order, payment } = data;
        
        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.total * 100), // Convert to cents
            currency: 'zar',
            payment_method: payment.paymentMethodId,
            confirm: true,
            return_url: 'https://waffleheaven.co.za/checkout-success',
            description: `Waffle Heaven Order - ${customer.email}`,
            metadata: {
                customerName: customer.name,
                customerEmail: customer.email
            }
        });
        
        if (paymentIntent.status === 'succeeded') {
            // Generate order reference
            const orderReference = generateOrderReference();
            
            // Store order in Supabase
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([
                    {
                        order_reference: orderReference,
                        customer_name: customer.name,
                        customer_email: customer.email,
                        customer_phone: customer.phone,
                        delivery_method: deliveryMethod,
                        delivery_info: deliveryInfo,
                        items: order.items,
                        subtotal: order.subtotal,
                        delivery_fee: order.deliveryFee,
                        tax: order.tax,
                        total: order.total,
                        payment_intent_id: paymentIntent.id,
                        payment_status: paymentIntent.status,
                        order_status: 'pending'
                    }
                ])
                .select('id');
                
            if (orderError) {
                console.error('Supabase order insert error:', orderError);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Failed to create order record. Payment was successful.' 
                    })
                };
            }
            
            // Send order confirmation email
            await sendOrderConfirmationEmail(customer.email, {
                orderReference,
                customerName: customer.name,
                items: order.items,
                total: order.total
            });
            
            // Return success response
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    orderId: orderReference,
                    paymentIntentId: paymentIntent.id 
                })
            };
        } else {
            // Payment requires additional action or failed
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Payment was not successful', 
                    paymentIntent: paymentIntent 
                })
            };
        }
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: error.message 
            })
        };
    }
};

function generateOrderReference() {
    // Generate a random order reference in the format WH-YYYYMMDD-XXXX
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `WH-${date}-${random}`;
}

async function sendOrderConfirmationEmail(email, orderDetails) {
    // This function would integrate with your email service provider
    // For example, using Mailjet, SendGrid, etc.
    
    // This is a placeholder implementation
    console.log('Sending order confirmation email to:', email);
    console.log('Order details:', orderDetails);
    
    // In a real implementation, you would call your email service API here
    return true;
}
