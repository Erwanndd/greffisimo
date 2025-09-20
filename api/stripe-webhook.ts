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

      // Capture old status and recipients before updating
      let oldStatus: string | null = null;
      let recipients: string[] = [];
      let formalityForEmail: any = null;
      if (!Number.isNaN(formalityId)) {
        const { data: current, error: curErr } = await supabase
          .from('formalities')
          .select(`id, company_name, status, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
          .eq('id', formalityId)
          .single();
        if (!curErr && current) {
          oldStatus = current.status as string;
          const clientProfiles = (current.clients || []).map((c: any) => c?.profile).filter(Boolean);
          const emails = [current.formalist?.email, ...clientProfiles.map((c: any) => c?.email)]
            .filter((e: any) => typeof e === 'string' && e.includes('@')) as string[];
          recipients = Array.from(new Set(emails));
          formalityForEmail = { ...current, clients: clientProfiles };
        }
      }

      // Update payments table
      await supabase
        .from('payments')
        .update({ status: 'paid', stripe_payment_intent_id: paymentIntentId || null })
        .eq('stripe_session_id', session.id);

      // Update formalities status: move straight to formalist processing
      if (!Number.isNaN(formalityId)) {
        await supabase
          .from('formalities')
          .update({ status: 'formalist_processing' })
          .eq('id', formalityId);

        // Send notification email (best-effort)
        try {
          const publicBase = process.env.PUBLIC_BASE_URL || '';
          const actionUrl = publicBase && formalityId ? `${publicBase.replace(/\/$/, '')}/formality/${formalityId}` : undefined;
          if (recipients.length > 0) {
            await supabase.functions.invoke('send-email', {
              body: {
                formality: formalityForEmail ? { ...formalityForEmail, status: 'formalist_processing' } : { id: formalityId, status: 'formalist_processing' },
                subject: formalityForEmail?.company_name
                  ? `Paiement confirmé – ${formalityForEmail.company_name}`
                  : 'Paiement confirmé',
                message: `Le paiement a été confirmé. Votre dossier passe en traitement par le formaliste.`,
                uploader: null,
                adminEmails: recipients,
                template: 'status_change',
                actionUrl,
                actionLabel: 'Accéder au dossier',
                meta: { oldStatus: oldStatus || 'pending_payment' },
              },
            });
          }
        } catch (e) {
          console.error('send-email invocation failed (ignored):', e);
        }
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
