// Supabase Edge Function: create-checkout-session
// Requires env: STRIPE_SECRET_KEY, PUBLIC_BASE_URL (optional)
import Stripe from 'npm:stripe@^14.0.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { formalityId, amount, currency = 'eur', customerEmail, priceId, successPath, cancelPath } = await req.json();
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const origin = req.headers.get('origin') || Deno.env.get('PUBLIC_BASE_URL') || 'http://localhost:5173';
    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency,
            product_data: { name: `Formalité #${formalityId}` },
            unit_amount: amount,
          },
          quantity: 1,
        }];

    // Append session_id template to success URL
    const appendSessionId = (base: string) => {
      if (!base) return `${origin}/`;
      const hasQuery = base.includes('?');
      return `${origin}${base}${hasQuery ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: appendSessionId(successPath || '/'),
      cancel_url: `${origin}${cancelPath || '/'}`,
      customer_email: customerEmail,
      metadata: { formalityId: String(formalityId) },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 400 });
  }
});
