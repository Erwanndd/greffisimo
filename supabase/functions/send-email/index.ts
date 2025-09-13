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

    const { formality, subject, message, uploader, adminEmails, template, actionUrl, actionLabel, meta } = await req.json();

    const recipients = Array.isArray(adminEmails) ? adminEmails.filter(Boolean) : [];
    if (!recipients.length) throw new Error('No recipients provided');

    const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') || '';

    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const fmtAmount = (amount?: number, currency?: string) => {
      if (!amount) return '';
      try { return `${(amount / 100).toFixed(2)} ${(currency || 'EUR').toUpperCase()}` } catch { return '' }
    };

    const renderButton = (url?: string, label?: string, color = '#3B82F6') => {
      if (!url) return '';
      const safeLabel = escapeHtml(label || 'Ouvrir');
      return `<a href="${url}" target="_blank" style="display:inline-block;background:${color};color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:600">${safeLabel}</a>`;
    };

    const formalitySection = formality ? `
      <table role="presentation" width="100%" style="margin-top:16px">
        <tr>
          <td style="font-size:14px;color:#4B5563">
            <div><strong>Formalité:</strong> ${escapeHtml(formality.company_name || '')} ( #${formality.id} )</div>
            ${formality.type ? `<div><strong>Type:</strong> ${escapeHtml(formality.type)}</div>` : ''}
            ${formality.status ? `<div><strong>Statut:</strong> ${escapeHtml(formality.status)}</div>` : ''}
          </td>
        </tr>
      </table>` : '';

    const baseLink = (formality?.id && PUBLIC_APP_URL)
      ? `${PUBLIC_APP_URL.replace(/\/$/,'')}/formality/${formality.id}`
      : '';

    const templates: Record<string, (p: any) => string> = {
      payment_link: ({ message, actionUrl, meta }: any) => {
        const amountStr = fmtAmount(meta?.amount, meta?.currency);
        return `
        <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0B1220;padding:24px">
          <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#0F172A;border:1px solid #1F2937;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.25)">
            <tr>
              <td style="padding:24px 24px 12px 24px">
                <div style="font-size:18px;color:#fff;font-weight:700">Greffissimo</div>
                <div style="font-size:13px;color:#9CA3AF">Lien de paiement</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px">
                <div style="font-size:15px;color:#E5E7EB;line-height:1.6">${escapeHtml((message || '').toString())}</div>
                ${amountStr ? `<div style="margin-top:8px;color:#93C5FD;font-weight:600">Montant: ${amountStr}</div>` : ''}
                <div style="margin-top:16px">${renderButton(actionUrl, 'Payer maintenant', '#10B981')}</div>
                ${formalitySection}
              </td>
            </tr>
            ${baseLink ? `<tr><td style="padding:16px 24px 24px 24px"><div style="font-size:12px;color:#9CA3AF">Vous pouvez suivre votre dossier ici: <a style="color:#60A5FA" href="${baseLink}">${baseLink}</a></div></td></tr>` : ''}
          </table>
        </div>`;
      },
      generic: ({ message, actionUrl }: any) => `
        <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0B1220;padding:24px">
          <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#0F172A;border:1px solid #1F2937;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.25)">
            <tr>
              <td style="padding:24px 24px 12px 24px">
                <div style="font-size:18px;color:#fff;font-weight:700">Greffissimo</div>
                <div style="font-size:13px;color:#9CA3AF">Notification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 16px 24px">
                <div style="font-size:15px;color:#E5E7EB;line-height:1.6">${escapeHtml((message || '').toString())}</div>
                ${actionUrl ? `<div style="margin-top:16px">${renderButton(actionUrl, 'Ouvrir')}</div>` : ''}
                ${formalitySection}
              </td>
            </tr>
            ${baseLink ? `<tr><td style="padding:0 24px 24px 24px"><div style="font-size:12px;color:#9CA3AF">Accéder à la formalité: <a style=\"color:#60A5FA\" href=\"${baseLink}\">${baseLink}</a></div></td></tr>` : ''}
          </table>
        </div>`
    };

    const chosen = (template && templates[template]) ? template : 'generic';
    const html = templates[chosen]({ message, actionUrl, meta });
    const textFallback = `${(message || '').toString()}${actionUrl ? `\n\nLien: ${actionUrl}` : ''}${formality ? `\n\nFormalité: ${formality.company_name || ''} (#${formality.id})` : ''}`;

    const payload: Record<string, unknown> = {
      personalizations: [
        {
          to: recipients.map((email: string) => ({ email })),
          subject: subject || 'Notification',
        },
      ],
      from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
      content: [
        { type: 'text/plain', value: textFallback },
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
