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
      return `<a href="${url}" target="_blank" style="display:inline-block;background:${color};color:#fff;text-decoration:none;border-radius:8px;padding:14px 28px;font-weight:600;margin-top:20px;box-shadow:0 4px 6px rgba(0,0,0,0.1);transition:all 0.2s">${safeLabel}</a>`;
    };

    const getStatusBadge = (status: string) => {
      const statusMap: Record<string, {label: string, color: string}> = {
        'pending_payment': { label: 'En attente de paiement', color: '#F59E0B' },
        'paid': { label: 'Payé', color: '#3B82F6' },
        'formalist_processing': { label: 'Traitement par le formaliste', color: '#8B5CF6' },
        'greffe_processing': { label: 'Traitement par le greffe', color: '#6366F1' },
        'validated': { label: 'Dossier validé', color: '#10B981' },
      };
      const statusInfo = statusMap[status] || { label: status, color: '#6B7280' };
      return `<span style="display:inline-block;background:${statusInfo.color}20;color:${statusInfo.color};border:1px solid ${statusInfo.color}40;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600">${escapeHtml(statusInfo.label)}</span>`;
    };

    const formatDate = () => {
      return new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const baseLink = (formality?.id && PUBLIC_APP_URL)
      ? `${PUBLIC_APP_URL.replace(/\/$/,'')}/formality/${formality.id}`
      : '';

    const headerSection = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%);border-radius:12px 12px 0 0">
        <tr>
          <td style="padding:32px;text-align:center">
            <div style="display:inline-block">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.15);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;backdrop-filter:blur(10px)">
                <span style="font-size:28px;font-weight:bold;color:#fff">G</span>
              </div>
              <div style="font-size:24px;color:#fff;font-weight:700;letter-spacing:-0.5px">Greffissimo</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">Simplifiez vos formalités juridiques</div>
            </div>
          </td>
        </tr>
      </table>`;

    const footerSection = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:0 0 12px 12px;border-top:1px solid #E5E7EB">
        <tr>
          <td style="padding:24px;text-align:center">
            <div style="font-size:12px;color:#6B7280;line-height:1.6">
              <div style="margin-bottom:8px">© ${new Date().getFullYear()} Greffissimo - Tous droits réservés</div>
              ${baseLink ? `<div>Vous pouvez suivre votre dossier à tout moment : <a style="color:#3B82F6;text-decoration:none" href="${baseLink}">Accéder au dossier</a></div>` : ''}
              <div style="margin-top:12px">
                <a href="mailto:contact@greffissimo.fr" style="color:#3B82F6;text-decoration:none">contact@greffissimo.fr</a>
              </div>
            </div>
          </td>
        </tr>
      </table>`;

    const formalityDetailsSection = (showStatus = true) => formality ? `
      <div style="background:#F9FAFB;border-radius:8px;padding:20px;margin-top:24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0">
              <div style="font-size:14px">
                <span style="color:#6B7280">Société :</span>
                <span style="color:#111827;font-weight:600;margin-left:8px">${escapeHtml(formality.company_name || '')}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0">
              <div style="font-size:14px">
                <span style="color:#6B7280">Référence :</span>
                <span style="color:#111827;font-weight:600;margin-left:8px">#${formality.id}</span>
              </div>
            </td>
          </tr>
          ${formality.type ? `
          <tr>
            <td style="padding:8px 0">
              <div style="font-size:14px">
                <span style="color:#6B7280">Type :</span>
                <span style="color:#111827;margin-left:8px">${escapeHtml(formality.type)}</span>
              </div>
            </td>
          </tr>` : ''}
          ${showStatus && formality.status ? `
          <tr>
            <td style="padding:12px 0 4px 0">
              <div style="font-size:14px">
                <span style="color:#6B7280">Statut actuel :</span>
                <span style="margin-left:8px">${getStatusBadge(formality.status)}</span>
              </div>
            </td>
          </tr>` : ''}
        </table>
      </div>` : '';

    const templates: Record<string, (p: any) => string> = {
      // Template 1: Payment Link
      payment_link: ({ message, actionUrl, meta }: any) => {
        const amountStr = fmtAmount(meta?.amount, meta?.currency);
        return `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#F3F4F6;padding:40px 20px">
          <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);overflow:hidden">
            ${headerSection}
            <tr>
              <td style="padding:40px 32px">
                
                <h1 style="font-size:24px;color:#111827;font-weight:700;text-align:center;margin:0 0 8px 0">
                  Votre lien de paiement est prêt
                </h1>
                <p style="font-size:16px;color:#6B7280;text-align:center;margin:0 0 32px 0">
                  Procédez au règlement pour démarrer le traitement de votre formalité
                </p>
                
                <div style="background:linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%);border-radius:8px;padding:24px;text-align:center;border:1px solid #93C5FD40">
                  <div style="font-size:14px;color:#6B7280;margin-bottom:8px">Montant à régler</div>
                  <div style="font-size:32px;color:#1E40AF;font-weight:700">${amountStr || 'Montant à confirmer'}</div>
                  ${renderButton(actionUrl, 'Procéder au paiement', '#10B981')}
                </div>
                
                ${message ? `
                <div style="margin-top:24px;padding:16px;background:#FEF3C7;border-radius:8px;border-left:4px solid #F59E0B">
                  <div style="font-size:14px;color:#92400E">📌 Note de votre formaliste</div>
                  <div style="font-size:14px;color:#78350F;margin-top:8px">${escapeHtml(message)}</div>
                </div>` : ''}
                
                ${formalityDetailsSection(false)}
                
                <div style="margin-top:32px;padding:20px;background:#F0F9FF;border-radius:8px;border:1px solid #BAE6FD40">
                  <div style="font-size:14px;color:#075985;line-height:1.6">
                    <div style="font-weight:600;margin-bottom:8px">🔒 Paiement sécurisé</div>
                    <div>Votre paiement est traité de manière sécurisée via Stripe. Une fois le règlement effectué, votre formalité sera immédiatement prise en charge par notre équipe.</div>
                  </div>
                </div>
              </td>
            </tr>
            ${footerSection}
          </table>
        </div>`;
      },

      // Template 2: Status Change
      status_change: ({ message, formality }: any) => {
        const oldStatus = meta?.oldStatus || '';
        const newStatus = formality?.status || '';
        return `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#F3F4F6;padding:40px 20px">
          <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);overflow:hidden">
            ${headerSection}
            <tr>
              <td style="padding:40px 32px">
                <h1 style="font-size:24px;color:#111827;font-weight:700;text-align:center;margin:0 0 8px 0">
                  Mise à jour du statut de votre dossier
                </h1>
                <p style="font-size:16px;color:#6B7280;text-align:center;margin:0 0 32px 0">
                  Le statut de votre formalité a été modifié
                </p>
                
                <div style="background:#F9FAFB;border-radius:8px;padding:24px">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
                    ${oldStatus ? `
                    <div style="text-align:center;flex:1">
                      <div style="font-size:12px;color:#6B7280;margin-bottom:8px">Statut précédent</div>
                      ${getStatusBadge(oldStatus)}
                    </div>
                    <div style="font-size:24px;color:#9CA3AF">→</div>` : ''}
                    <div style="text-align:center;flex:1">
                      <div style="font-size:12px;color:#6B7280;margin-bottom:8px">Nouveau statut</div>
                      ${getStatusBadge(newStatus)}
                    </div>
                  </div>
                </div>
                
                ${message ? `
                <div style="margin-top:24px;padding:16px;background:#F3F4F6;border-radius:8px">
                  <div style="font-size:14px;color:#6B7280;line-height:1.6">${escapeHtml(message)}</div>
                </div>` : ''}
                
                ${formalityDetailsSection(false)}
                
                <div style="margin-top:32px;text-align:center">
                  <div style="font-size:14px;color:#6B7280;margin-bottom:16px">
                    Suivez l'évolution de votre dossier en temps réel
                  </div>
                  ${renderButton(baseLink, 'Consulter mon dossier', '#3B82F6')}
                </div>
                
                <div style="margin-top:32px;padding:16px;background:#EFF6FF;border-radius:8px;border-left:4px solid #3B82F6">
                  <div style="font-size:13px;color:#1E40AF;line-height:1.6">
                    <strong>Prochaines étapes :</strong> Notre équipe continue le traitement de votre dossier. Vous recevrez une notification à chaque nouvelle étape importante.
                  </div>
                </div>
              </td>
            </tr>
            ${footerSection}
          </table>
        </div>`;
      },

      // Template 3: General Modifications
      modification: ({ message, actionUrl, modificationType }: any) => {
        const typeIcons: Record<string, string> = {
          document_added: '📎',
          document_removed: '🗑️',
          message_received: '💬',
          client_added: '👥',
          formality_created: '🎉',
          formality_updated: '✏️',
          default: '📝'
        };
        const icon = typeIcons[modificationType || 'default'] || typeIcons.default;
        
        return `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#F3F4F6;padding:40px 20px">
          <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);overflow:hidden">
            ${headerSection}
            <tr>
              <td style="padding:40px 32px">
                <div style="text-align:center;margin-bottom:32px">
                  <div style="width:80px;height:80px;background:linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 8px 16px rgba(139,92,246,0.2)">
                    <span style="font-size:36px">${icon}</span>
                  </div>
                </div>
                
                <h1 style="font-size:24px;color:#111827;font-weight:700;text-align:center;margin:0 0 24px 0">
                  Mise à jour de votre dossier
                </h1>
                
                <div style="background:#F9FAFB;border-radius:8px;padding:20px">
                  <div style="font-size:15px;color:#374151;line-height:1.6">
                    ${escapeHtml(message || 'Votre dossier a été mis à jour.')}
                  </div>
                  ${uploader ? `
                  <div style="margin-top:12px;padding-top:12px;border-top:1px solid #E5E7EB">
                    <span style="font-size:13px;color:#6B7280">Par : </span>
                    <span style="font-size:13px;color:#374151;font-weight:600">${escapeHtml(uploader.first_name || '')} ${escapeHtml(uploader.last_name || '')}</span>
                    <span style="font-size:13px;color:#9CA3AF"> • ${formatDate()}</span>
                  </div>` : ''}
                </div>
                
                ${formalityDetailsSection(true)}
                
                ${actionUrl ? `
                <div style="margin-top:32px;text-align:center">
                  ${renderButton(actionUrl, actionLabel || 'Voir les détails', '#8B5CF6')}
                </div>` : baseLink ? `
                <div style="margin-top:32px;text-align:center">
                  ${renderButton(baseLink, 'Accéder au dossier', '#8B5CF6')}
                </div>` : ''}
                
                <div style="margin-top:32px;padding:16px;background:#F5F3FF;border-radius:8px;border:1px solid #8B5CF640">
                  <div style="font-size:13px;color:#5B21B6;line-height:1.6">
                    <strong>💡 Bon à savoir :</strong> Toutes les modifications apportées à votre dossier sont tracées et sécurisées. Vous pouvez consulter l'historique complet dans votre espace client.
                  </div>
                </div>
              </td>
            </tr>
            ${footerSection}
          </table>
        </div>`;
      },

      // Fallback to modification template for generic notifications
      generic: (params: any) => templates.modification({ ...params, modificationType: 'default' })
    };

    // Automatically select template based on context
    let selectedTemplate = template;
    if (!selectedTemplate) {
      if (meta?.oldStatus || (message && message.includes('statut'))) {
        selectedTemplate = 'status_change';
      } else if (actionUrl && actionUrl.includes('stripe') || meta?.amount) {
        selectedTemplate = 'payment_link';
      } else {
        selectedTemplate = 'modification';
      }
    }

    const chosen = (selectedTemplate && templates[selectedTemplate]) ? selectedTemplate : 'modification';
    const html = templates[chosen]({ message, actionUrl, actionLabel, meta, formality, uploader, modificationType: meta?.type });
    const textFallback = `${(message || '').toString()}${actionUrl ? `\n\nLien: ${actionUrl}` : ''}${formality ? `\n\nFormalité: ${formality.company_name || ''} (#${formality.id})` : ''}`;

    const payload: Record<string, unknown> = {
      personalizations: [
        {
          to: recipients.map((email: string) => ({ email })),
          subject: subject || 'Notification Greffissimo',
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
