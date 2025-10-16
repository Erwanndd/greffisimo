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
    const {
      formalityId,
      formalityPrices,
      currency = 'eur',
      customerEmail,
      successPath,
      cancelPath,
    } = await req.json();

    if (!formalityId) {
      const err = new Error('Missing formalityId');
      (err as any).status = 400;
      throw err;
    }
    if (!formalityPrices || typeof formalityPrices !== 'object') {
      const err = new Error('Missing formality pricing information');
      (err as any).status = 400;
      throw err;
    }
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      const err = new Error('Missing STRIPE_SECRET_KEY');
      (err as any).status = 500;
      throw err;
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const origin = req.headers.get('origin') || Deno.env.get('PUBLIC_BASE_URL') || 'http://localhost:5173';
    const normalizePriceId = (value: unknown) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.startsWith('price_') ? trimmed : null;
    };

    const buildLineItems = () => {
      const parts = [
        { key: 'formality', fallbackName: `Formalité #${formalityId}` },
        { key: 'urgency', fallbackName: 'Option urgence' },
        { key: 'taxreg', fallbackName: 'Option enregistrement fiscal' },
      ] as const;

      const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const part of parts) {
        const pricing = (formalityPrices as Record<string, unknown>)[part.key] as { priceId?: string; amount?: number; label?: string } | undefined;
        if (!pricing) continue;
        const { amount, label } = pricing;
        const priceId = normalizePriceId(pricing.priceId);
        if (priceId) {
          items.push({ price: priceId, quantity: 1 });
          continue;
        }
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) continue;
        items.push({
          price_data: {
            currency,
            product_data: { name: String(label || part.fallbackName) },
            unit_amount: Math.round(numericAmount),
          },
          quantity: 1,
        });
      }

      if (!items.length) {
        const err = new Error('Aucun tarif valide pour la formalité');
        (err as any).status = 400;
        throw err;
      }

      return items;
    };

    const lineItems = buildLineItems();

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
      metadata: { formalityId: String(formalityId), pricing: JSON.stringify(formalityPrices) },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    console.error('[supabase/create-checkout-session] error', err);
    const status = typeof (err as any)?.status === 'number' ? (err as any).status : typeof (err as any)?.statusCode === 'number' ? (err as any).statusCode : 500;
    const message = (err as Error)?.message || 'Unexpected error while creating checkout session';
    return new Response(JSON.stringify({ error: message }), { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status });
  }
});
