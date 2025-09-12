// Supabase Edge Function: send-email
// Env: SENDGRID_API_KEY, EMAIL_FROM
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    if (!SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY');

    // Resolve and parse FROM
    const RAW_FROM = Deno.env.get('EMAIL_FROM') || Deno.env.get('SENDGRID_FROM_EMAIL') || 'no-reply@example.com';
    let fromEmail = RAW_FROM;
    let fromName = Deno.env.get('SENDGRID_FROM_NAME') || undefined;
    const bracketMatch = RAW_FROM.match(/^(.*)<\s*([^>]+@[^>]+)\s*>\s*$/);
    if (bracketMatch) {
      const maybeName = bracketMatch[1].trim();
      fromEmail = bracketMatch[2].trim();
      if (maybeName) fromName = maybeName.replace(/^"|"$/g, '');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      throw new Error(`Invalid EMAIL_FROM format: ${RAW_FROM}`);
    }

    const { formality, subject, message, uploader, adminEmails } = await req.json();

    const recipients = Array.isArray(adminEmails) ? adminEmails.filter(Boolean) : [];
    if (!recipients.length) throw new Error('No recipients provided');

    const html = `
      <div>
        <p>${(message || '').toString().replace(/\n/g, '<br/>')}</p>
        ${formality ? `
        <hr/>
        <p><strong>Formalité:</strong> ${formality.company_name || ''} (#${formality.id})</p>
        ` : ''}
      </div>
    `;

    const payload: Record<string, unknown> = {
      personalizations: [
        {
          to: recipients.map((email: string) => ({ email })),
          subject: subject || 'Notification',
        },
      ],
      from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
      content: [
        { type: 'text/plain', value: (message || '').toString() },
        { type: 'text/html', value: html },
      ],
    };

    // Optional reply-to support
    const REPLY_TO = Deno.env.get('SENDGRID_REPLY_TO_EMAIL');
    if (REPLY_TO && emailRegex.test(REPLY_TO)) {
      (payload as any).reply_to = { email: REPLY_TO };
    }

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!sgRes.ok) {
      const errTxt = await sgRes.text().catch(() => '');
      throw new Error(`SendGrid error ${sgRes.status}: ${errTxt}`);
    }

    const requestId = sgRes.headers.get('x-message-id') || null;

    return new Response(JSON.stringify({ ok: true, id: requestId }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});
