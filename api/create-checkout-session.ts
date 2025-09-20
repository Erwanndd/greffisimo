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
    res.end('Method Not Allowed');
    return;
  }

  try {
    const raw = await readRawBody(req);
    const body = JSON.parse(raw.toString() || '{}');

    const {
      formalityId,
      amount,
      currency = 'eur',
      customerEmail,
      priceId,
      successPath,
      cancelPath,
    } = body || {};

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      res.statusCode = 500;
      res.end('Missing STRIPE_SECRET_KEY');
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const originHeader = req.headers['origin'] as string | undefined;
    const publicBase = process.env.PUBLIC_BASE_URL;
    const origin = originHeader || publicBase || 'http://localhost:5173';

    const lineItems = priceId
      ? [{ price: String(priceId), quantity: 1 }]
      : [{
          price_data: {
            currency,
            product_data: { name: `Formalité #${formalityId}` },
            unit_amount: Number(amount),
          },
          quantity: 1,
        }];

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
      metadata: { formalityId: String(formalityId ?? '') },
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: session.url, sessionId: session.id }));
  } catch (err: any) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Bad Request' }));
  }
}
