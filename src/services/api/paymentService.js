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

export const createCheckoutSession = async ({ formalityId, formalityPrices, currency = 'eur', customerEmail }) => {
  console.log('create checkout session pricing', formalityPrices);
  if (!formalityId) throw new Error('Identifiant de formalité manquant');
  if (!formalityPrices || typeof formalityPrices !== 'object') throw new Error('Données tarifaires invalides');

  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formalityId,
      formalityPrices,
      currency,
      customerEmail,
      successPath: `/checkout/success?formalityId=${formalityId}`,
      cancelPath: `/checkout/cancel?formalityId=${formalityId}`,
    }),
  });
  if (!res.ok) {
    let message = 'Failed to create checkout session';
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        message = data?.error || data?.message || message;
      } else {
        const text = await res.text();
        message = text || message;
      }
    } catch (parseErr) {
      console.warn('Unable to parse checkout error response', parseErr);
    }
    throw new Error(`${message} (HTTP ${res.status})`);
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

const sanitizeStripePriceId = (maybeId) => {
  if (typeof maybeId !== 'string') return null;
  const trimmed = maybeId.trim();
  return trimmed.startsWith('price_') ? trimmed : null;
};

export const computeFormalityPrices = async (formalityType, isUrgent, requiresTaxRegistration) => {
  // Build array of names to fetch: the base type, and optionally urgency/tax reg
  let formalityName = '';
  if (['Constitution', 'Dépôt des comptes', 'Cession de titres', "Dépôt d'actes"].includes(formalityType)) {
    formalityName = formalityType;
  }
  else {
    formalityName = "Formalité simple";
  }
  const names = [formalityName];
  if (isUrgent) names.push('Option: Urgence');
  if (requiresTaxRegistration) names.push('Option: Enregistrement fiscal');

  const { data, error } = await supabase
    .from('tariffs')
    .select('price_id,amount,name')
    .in('name', names);

  console.log('[computeFormalityPrices] tariffs', data);

  handleSupabaseError({ error, customMessage: 'computing formality amount' });

  let basePrice = 0, urgencyPrice = 0, taxRegPrice = 0;
  let basePriceId = null, urgencyPriceId = null, taxRegPriceId = null;

  if (Array.isArray(data)) {
    for (const row of data) {
      if (row.name === formalityName) {
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
      label: formalityType,
      priceId: sanitizeStripePriceId(basePriceId),
      amount: basePrice,
    },
    urgency: {
      label: 'Option urgence',
      priceId: sanitizeStripePriceId(urgencyPriceId),
      amount: urgencyPrice,
    },
    taxreg: {
      label: 'Option enregistrement fiscal',
      priceId: sanitizeStripePriceId(taxRegPriceId),
      amount: taxRegPrice,
    },
    total: (basePrice * 1.2) + urgencyPrice + taxRegPrice,
  };
};
