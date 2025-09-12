// Supabase Edge Function: stripe-webhook
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUP_URL, SUP_SERVICE_ROLE_KEY
import Stripe from 'npm:stripe@^14.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allow unauthenticated requests (Stripe doesn't send Authorization)
export const verifyJWT = false;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUP_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUP_SERVICE_ROLE_KEY');

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return new Response('Missing environment configuration', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  let event: Stripe.Event;
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const formalityId = Number(session.metadata?.formalityId);
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

      // Update payments table
      await supabase.from('payments')
        .update({ status: 'paid', stripe_payment_intent_id: paymentIntentId || null })
        .eq('stripe_session_id', session.id);

      // Update formalities status
      if (!Number.isNaN(formalityId)) {
        await supabase.from('formalities').update({ status: 'paid' }).eq('id', formalityId);
      }
    }
  } catch (err) {
    console.error('Error handling webhook:', err);
    return new Response('Webhook handler failed', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    status: 200,
  });
});
