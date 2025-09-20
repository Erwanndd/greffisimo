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

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
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

      // Capture current formality for email context
      let oldStatus: string | null = null;
      let recipients: string[] = [];
      let formalityForEmail: any = null;
      if (!Number.isNaN(formalityId)) {
        const { data: current } = await supabase
          .from('formalities')
          .select(`id, company_name, status, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
          .eq('id', formalityId)
          .single();
        if (current) {
          oldStatus = current.status as string;
          const clientProfiles = (current.clients || []).map((c: any) => c?.profile).filter(Boolean);
          const emails = [current.formalist?.email, ...clientProfiles.map((c: any) => c?.email)]
            .filter((e: any) => typeof e === 'string' && e.includes('@')) as string[];
          recipients = Array.from(new Set(emails));
          formalityForEmail = { ...current, clients: clientProfiles };
        }
      }


      // Update payments table
      await supabase.from('payments')
        .update({ status: 'paid', stripe_payment_intent_id: paymentIntentId || null })
        .eq('stripe_session_id', session.id);

      // Update formalities status: move straight to formalist processing
      if (!Number.isNaN(formalityId)) {
        await supabase.from('formalities').update({ status: 'formalist_processing' }).eq('id', formalityId);

        // Best-effort email notification via send-email function
        try {
          const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') || '';
          const actionUrl = PUBLIC_APP_URL && formalityId ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/formality/${formalityId}` : undefined;
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
    return new Response('Webhook handler failed', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    status: 200,
  });
});
