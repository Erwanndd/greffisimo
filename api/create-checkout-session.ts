import Stripe from 'stripe';

// Helper to read raw request body (Node IncomingMessage)
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
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString() || '{}');
    console.log('[api/create-checkout-session] incoming body', body);

    const {
      formalityId,
      formalityPrices,
      currency = 'eur',
      customerEmail,
      successPath,
      cancelPath,
    } = body || {};

    if (!formalityId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing formalityId' }));
      return;
    }

    if (!formalityPrices || typeof formalityPrices !== 'object') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing formality pricing information' }));
      return;
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }));
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const originHeader = req.headers['origin'] as string | undefined;
    const publicBase = process.env.PUBLIC_BASE_URL;
    const origin = originHeader || publicBase || 'http://localhost:5173';

    const normalizePriceId = (value: unknown) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.startsWith('price_') ? trimmed : null;
    };

    const makeLineItems = () => {
      const parts = [
        { key: 'formality', fallbackName: `Formalité #${formalityId}` },
        { key: 'urgency', fallbackName: 'Option urgence' },
        { key: 'taxreg', fallbackName: 'Option enregistrement fiscal' },
      ] as const;

      const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const part of parts) {
        const pricing = (formalityPrices as Record<string, any>)[part.key];
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
        (err as any).statusCode = 400;
        throw err;
      }

      return items;
    };

    const lineItems = makeLineItems();

    const appendSessionId = (base?: string) => {
      const path = base || '/';
      const hasQuery = path.includes('?');
      return `${origin}${path}${hasQuery ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems as any,
      success_url: appendSessionId(successPath),
      cancel_url: `${origin}${cancelPath || '/'}`,
      customer_email: customerEmail,
      metadata: {
        formalityId: String(formalityId ?? ''),
        pricing: JSON.stringify(formalityPrices),
      },
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: session.url, sessionId: session.id }));
  } catch (err: any) {
    console.error('[api/create-checkout-session] error', err);
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const message = err?.message || 'Unexpected error while creating checkout session';
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  }
}
