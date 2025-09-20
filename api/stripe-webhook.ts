import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Read raw body (required by Stripe signature verification)
async function readRawBody(req: any): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUP_URL; // support both names
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUP_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    res.statusCode = 500;
    res.end('Missing environment configuration');
    return;
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    const signature = req.headers['stripe-signature'] as string | undefined;
    event = stripe.webhooks.constructEvent(raw, signature!, webhookSecret);
  } catch (err: any) {
    res.statusCode = 400;
    res.end(`Webhook Error: ${err?.message || 'Invalid payload'}`);
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const formalityId = Number(session.metadata?.formalityId);
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      // Update payments table
      await supabase
        .from('payments')
        .update({ status: 'paid', stripe_payment_intent_id: paymentIntentId || null })
        .eq('stripe_session_id', session.id);

      // Update formalities status
      if (!Number.isNaN(formalityId)) {
        await supabase
          .from('formalities')
          .update({ status: 'paid' })
          .eq('id', formalityId);
      }
    }
  } catch (err) {
    console.error('Error handling webhook:', err);
    res.statusCode = 500;
    res.end('Webhook handler failed');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ received: true }));
}
