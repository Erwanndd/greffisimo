import { supabase } from '@/lib/customSupabaseClient';
import { handleSupabaseError } from './utils';

export const hasPaidPaymentForFormality = async (formalityId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id, status')
    .eq('formality_id', formalityId)
    .in('status', ['paid', 'succeeded'])
    .limit(1);
  handleSupabaseError({ error, customMessage: 'checking payments' });
  return Array.isArray(data) && data.length > 0;
};

export const createCheckoutSession = async ({ formalityId, amount, currency = 'eur', customerEmail, priceId }) => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      formalityId,
      amount,
      currency,
      customerEmail,
      priceId,
      successPath: `/checkout/success?formalityId=${formalityId}`,
      cancelPath: `/checkout/cancel?formalityId=${formalityId}`,
    },
  });
  if (error) throw error;
  return data; // expected: { url, sessionId }
};

export const recordPaymentLink = async ({ formalityId, sessionId, url, amount, currency, customerEmail }) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([{ formality_id: formalityId, stripe_session_id: sessionId, url, amount, currency, customer_email: customerEmail, status: 'created' }])
    .select()
    .single();
  handleSupabaseError({ error, customMessage: 'recording payment link' });
  return data;
};

export const hasPaymentLinkForFormality = async (formalityId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id, url, status')
    .eq('formality_id', formalityId)
    .not('url', 'is', null)
    .limit(1);
  handleSupabaseError({ error, customMessage: 'checking payment link presence' });
  return Array.isArray(data) && data.length > 0;
};
