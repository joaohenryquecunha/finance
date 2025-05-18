import { createClient } from 'npm:@supabase/supabase-js@2';

interface PaymentWebhookPayload {
  type: string;
  event: string;
  oldStatus: string;
  currentStatus: string;
  sale: {
    id: number;
    status: string;
    total: number;
    amount: number;
    paid_at: string;
    method: string;
  };
  client: {
    id: number;
    name: string;
    email: string;
    document: string;
    cellphone: string;
  };
  product: {
    id: number;
    name: string;
    amount: number;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Map product IDs to subscription days
const PRODUCT_SUBSCRIPTION_DAYS: Record<number, number> = {
  673: 30,  // 30 days subscription
  672: 180, // 180 days subscription
  700: 365  // 365 days subscription
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const payload: PaymentWebhookPayload = await req.json();

    // Validate the webhook payload
    if (!payload.sale || !payload.client || !payload.product) {
      throw new Error('Invalid webhook payload');
    }

    // Only process paid sales
    if (payload.sale.status !== 'paid') {
      return new Response(JSON.stringify({ 
        message: 'Payment not completed, ignoring' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get subscription days based on product ID
    const subscriptionDays = PRODUCT_SUBSCRIPTION_DAYS[payload.product.id];
    if (!subscriptionDays) {
      throw new Error(`Invalid product ID: ${payload.product.id}`);
    }

    // Convert days to seconds for access_duration
    const accessDurationSeconds = subscriptionDays * 24 * 60 * 60;

    // Find user by document (CPF)
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, trial_expires_at')
      .eq('cpf', payload.client.document.replace(/\D/g, ''))
      .single();

    if (profileError || !profiles) {
      throw new Error('User not found');
    }

    // Calculate new expiration date
    let startDate = new Date();
    
    // If user has an active subscription, add days to current expiration
    if (profiles.trial_expires_at) {
      const currentExpiration = new Date(profiles.trial_expires_at);
      if (currentExpiration > startDate) {
        startDate = currentExpiration;
      }
    }
    
    const newExpirationDate = new Date(startDate);
    newExpirationDate.setDate(newExpirationDate.getDate() + subscriptionDays);

    // Update user access based on payment
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        is_approved: true,
        access_duration: accessDurationSeconds,
        trial_expires_at: newExpirationDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profiles.id);

    if (updateError) {
      throw updateError;
    }

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: profiles.id,
        payment_id: payload.sale.id.toString(),
        amount: payload.sale.amount,
        status: payload.sale.status,
        payment_method: payload.sale.method,
        paid_at: payload.sale.paid_at,
        subscription_days: subscriptionDays,
        expires_at: newExpirationDate.toISOString()
      });

    if (paymentError) {
      throw paymentError;
    }

    return new Response(JSON.stringify({ 
      message: 'Payment processed successfully',
      subscriptionDays,
      expiresAt: newExpirationDate.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});