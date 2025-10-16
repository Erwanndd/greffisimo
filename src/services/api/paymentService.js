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

export const createCheckoutSession = async ({ formalityPrices, currency = 'eur', customerEmail }) => {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formalityPrices,
      currency,
      customerEmail,
      successPath: `/checkout/success?formalityId=${formalityId}`,
      cancelPath: `/checkout/cancel?formalityId=${formalityId}`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create checkout session');
  }
  return await res.json(); // { url, sessionId }
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

export const computeFormalityPrices = async (formalityType, isUrgent, requiresTaxRegistration) => {
  // Build array of names to fetch: the base type, and optionally urgency/tax reg
  const names = [formalityType];
  if (isUrgent) names.push('Option: Urgence');
  if (requiresTaxRegistration) names.push('Option: Enregistrement fiscal');

  const { data, error } = await supabase
    .from('tariffs')
    .select('price_id,amount,name')
    .in('name', names);

  handleSupabaseError({ error, customMessage: 'computing formality amount' });

  let basePrice = 0, urgencyPrice = 0, taxRegPrice = 0;
  let basePriceId = null, urgencyPriceId = null, taxRegPriceId = null;

  if (Array.isArray(data)) {
    for (const row of data) {
      if (row.name === formalityType) {
        basePrice = row.amount || 0;
        basePriceId = row.price_id || null;
      } else if (row.name === 'Option: Urgence') {
        urgencyPrice = row.amount || 0;
        urgencyPriceId = row.price_id || null;
      } else if (row.name === 'Option: Enregistrement fiscal') {
        taxRegPrice = row.amount || 0;
        taxRegPriceId = row.price_id || null;
      }
    }
  }

  return {
    formality: {
      priceId: basePriceId,
      amount: basePrice,
    },
    urgency: {
      priceId: urgencyPriceId,
      amount: urgencyPrice,
    },
    taxreg: {
      priceId: taxRegPriceId,
      amount: taxRegPrice,
    },
    total: (basePrice * 1.2) + urgencyPrice + taxRegPrice,
  };
};
