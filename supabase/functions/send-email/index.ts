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
    const baseLink = (formality?.id && PUBLIC_APP_URL)
      ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/formality/${formality.id}`
      : '';

    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const statusMap: Record<string, { label: string; color: string }> = {
      pending_payment: { label: 'En attente de paiement', color: '#F59E0B' },
      formalist_processing: { label: 'Traitement par le formaliste', color: '#8B5CF6' },
      greffe_processing: { label: 'Traitement par le greffe', color: '#6366F1' },
      validated: { label: 'Dossier validé', color: '#10B981' },
    };

    const formatStatusLabel = (status: string) => statusMap[status]?.label || status;

    const getStatusBadge = (status: string) => {
      const statusInfo = statusMap[status] || { label: status, color: '#6B7280' };
      return `<span style="display:inline-block;background:${statusInfo.color}20;color:${statusInfo.color};border:1px solid ${statusInfo.color}40;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:600">${escapeHtml(statusInfo.label)}</span>`;
    };

    const formatDate = () => {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const describeTribunal = (formalityObj?: any) => {
      const rawName = formalityObj?.tribunal?.name?.trim();
      if (!rawName) return 'greffe du tribunal de commerce compétent';
      const lower = rawName.toLowerCase();
      if (lower.includes('greffe')) return rawName;
      if (lower.includes('tribunal')) return `greffe du ${rawName}`;
      return `greffe du tribunal de commerce de ${rawName}`;
    };

    const formatFormalistReference = (formalist?: any) => {
      if (!formalist) return '';
      const parts = [formalist.first_name, formalist.last_name]
        .filter((part: unknown) => typeof part === 'string' && part.trim().length > 0)
        .map((part: string) => part.trim());
      if (!parts.length) return '';
      return `Me ${parts.join(' ')}`;
    };

    const renderButton = (url?: string, label?: string, color = '#3B82F6') => {
      if (!url) return '';
      const safeLabel = escapeHtml(label || 'Ouvrir');
      return `<a href="${url}" target="_blank" style="display:inline-block;background:${color};color:#fff;text-decoration:none;border-radius:8px;padding:14px 28px;font-weight:600;margin-top:20px;box-shadow:0 4px 6px rgba(0,0,0,0.1);transition:all 0.2s">${safeLabel}</a>`;
    };

    const headerSection = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:0 0 12px 12px;border-top:1px solid #E5E7EB">
        <tr>
          <td style="padding:32px;text-align:center">
            <div style="display:inline-block">
              <div style="font-size:18px;color:#111827;font-weight:500;text-align:center;margin:0 0 8px 0">Greffissimo</div>
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

    const wrapEmail = (content: string) => `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#F3F4F6;padding:40px 20px">
        <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);overflow:hidden">
          ${headerSection}
          <tr>
            <td style="padding:40px 32px">
              ${content}
            </td>
          </tr>
          ${footerSection}
        </table>
      </div>`;

    const buildLetterEmail = ({
      paragraphs,
      closing = [],
      linkUrl,
      linkLabel,
      buttonColor = '#3B82F6',
      includeFormalityDetails = false,
      showStatus = false,
    }: {
      paragraphs: string[];
      closing?: string[];
      linkUrl?: string;
      linkLabel?: string;
      buttonColor?: string;
      includeFormalityDetails?: boolean;
      showStatus?: boolean;
    }) => {
      const safeParagraphs = (paragraphs || [])
        .filter((p) => typeof p === 'string' && p.trim().length > 0)
        .map((p) => p.trim());
      const safeClosing = (closing || [])
        .filter((p) => typeof p === 'string' && p.trim().length > 0)
        .map((p) => p.trim());

      const paragraphsHtml = safeParagraphs
        .map((p) => `<p style="font-size:16px;color:#111827;line-height:1.7;margin:0 0 16px 0">${escapeHtml(p)}</p>`)
        .join('');
      const closingHtml = safeClosing
        .map((p) => `<p style="font-size:16px;color:#111827;line-height:1.7;margin:0 0 16px 0">${escapeHtml(p)}</p>`)
        .join('');

      const linkHtml = linkUrl
        ? `<p style="font-size:16px;color:#111827;line-height:1.7;margin:0 0 16px 0">Lien : <a href="${linkUrl}" style="color:#2563EB;text-decoration:none">${escapeHtml(linkUrl)}</a></p>`
        : '';
      const buttonHtml = linkUrl && linkLabel
        ? `<div style="margin-top:24px">${renderButton(linkUrl, linkLabel, buttonColor)}</div>`
        : '';

      const detailsHtml = includeFormalityDetails ? formalityDetailsSection(showStatus) : '';
      const html = wrapEmail(`${paragraphsHtml}${linkHtml}${buttonHtml}${closingHtml}${detailsHtml}`);
      const textLines = [
        ...safeParagraphs,
        ...(linkUrl ? [`Lien : ${linkUrl}`] : []),
        ...safeClosing,
      ];
      const text = textLines.join('\n\n');
      return { html, text };
    };

    type TemplateParams = {
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      meta?: any;
      formality?: any;
      uploader?: any;
    };

    type TemplateOutput = {
      subject?: string;
      html: string;
      text?: string;
    };

    const templates: Record<string, (p: TemplateParams) => TemplateOutput> = {
      payment_link: ({ actionUrl, actionLabel, formality: formalityParam }: TemplateParams) => {
        const formalistRef = formatFormalistReference(formalityParam?.formalist) || 'votre formaliste';
        const tribunalDescription = describeTribunal(formalityParam);
        const { html, text } = buildLetterEmail({
          paragraphs: [
            'Madame, Monsieur,',
            `Dans le prolongement de l'opération réalisée avec ${formalistRef}, veuillez trouver ci-après le lien de paiement concernant la formalité à réaliser auprès du ${tribunalDescription}.`,
            'Nous vous remercions par avance pour votre paiement, ce dernier permet de finaliser le dépôt de la formalité auprès du greffe.',
          ],
          closing: ['Merci.', "L'Équipe Greffissimo"],
          linkUrl: actionUrl,
          linkLabel: actionLabel || 'Payer maintenant',
          buttonColor: '#10B981',
          includeFormalityDetails: false,
          showStatus: false,
        });
        return {
          subject: 'Notification pour paiement',
          html,
          text,
        };
      },

      status_change: ({ message: statusMessage, actionUrl: statusActionUrl, formality: statusFormality }: TemplateParams) => {
        const oldStatus = meta?.oldStatus || '';
        const newStatus = statusFormality?.status || meta?.newStatus || '';
        const linkForStatus = statusActionUrl || baseLink || '';
        const tribunalDescription = describeTribunal(statusFormality);

        if (newStatus === 'formalist_processing') {
          const { html, text } = buildLetterEmail({
            paragraphs: [
              'Madame, Monsieur,',
              'Nous vous confirmons la bonne réception de votre paiement.',
              `Votre dossier est désormais en cours de traitement par l'un(e) de nos formalistes et sera très prochainement déposé au ${tribunalDescription}.`,
              'Vous recevrez une notification dès que ce dernier aura été validé par le greffe.',
            ],
            closing: ['Merci.', "L'Équipe Greffissimo"],
            linkUrl: linkForStatus || undefined,
            linkLabel: linkForStatus ? 'Consulter votre dossier' : undefined,
            includeFormalityDetails: false,
            showStatus: false,
          });
          return {
            subject: 'Notification de confirmation de paiement et de traitement de dossier par le formaliste',
            html,
            text,
          };
        }

        if (newStatus === 'validated') {
          const { html, text } = buildLetterEmail({
            paragraphs: [
              'Madame, Monsieur,',
              `Nous vous informons que votre dossier a été validé par le ${tribunalDescription}.`,
              'Merci de vous connecter sur votre espace personnel pour accéder aux documents correspondants.',
            ],
            closing: ['Merci.', "L'Équipe Greffissimo"],
            linkUrl: linkForStatus || undefined,
            linkLabel: linkForStatus ? 'Accéder à mon espace' : undefined,
            includeFormalityDetails: false,
            showStatus: false,
          });
          return {
            subject: 'Notification de dossier validé',
            html,
            text,
          };
        }

        const infoParagraphs = [
          'Madame, Monsieur,',
          oldStatus ? `Statut précédent : ${formatStatusLabel(oldStatus)}` : '',
          newStatus ? `Nouveau statut : ${formatStatusLabel(newStatus)}` : '',
          statusMessage || '',
        ].filter((line) => line && line.trim().length > 0);

        const { html, text } = buildLetterEmail({
          paragraphs: infoParagraphs,
          closing: ['Merci.', "L'Équipe Greffissimo"],
          linkUrl: linkForStatus || undefined,
          linkLabel: linkForStatus ? 'Consulter mon dossier' : undefined,
          includeFormalityDetails: true,
          showStatus: true,
        });

        return { html, text };
      },

      modification: ({ message: modificationMessage, actionUrl: modificationActionUrl, actionLabel: modificationActionLabel, uploader: modificationUploader }: TemplateParams) => {
        const uploaderLine = modificationUploader
          ? `Par : ${[
              modificationUploader.first_name,
              modificationUploader.last_name,
            ]
              .filter((part: unknown) => typeof part === 'string' && part.trim().length > 0)
              .map((part: string) => part.trim())
              .join(' ')} • ${formatDate()}`
          : '';

        const { html, text } = buildLetterEmail({
          paragraphs: [
            'Madame, Monsieur,',
            modificationMessage || 'Votre dossier a été mis à jour.',
            uploaderLine,
          ],
          closing: ['Merci.', "L'Équipe Greffissimo"],
          linkUrl: modificationActionUrl || baseLink || undefined,
          linkLabel: (modificationActionUrl || baseLink)
            ? modificationActionLabel || 'Consulter le dossier'
            : undefined,
          includeFormalityDetails: true,
          showStatus: true,
        });

        return { html, text };
      },

      generic: (params: TemplateParams) => templates.modification({ ...params }),
    };

    let selectedTemplate = template;
    if (!selectedTemplate) {
      if (meta?.oldStatus || (typeof message === 'string' && message.includes('statut'))) {
        selectedTemplate = 'status_change';
      } else if ((actionUrl && actionUrl.includes('stripe')) || meta?.amount) {
        selectedTemplate = 'payment_link';
      } else {
        selectedTemplate = 'modification';
      }
    }

    const templateParams: TemplateParams = { message, actionUrl, actionLabel, meta, formality, uploader };
    const render = templates[selectedTemplate] || templates.modification;
    const output = render(templateParams);

    const fallbackTextParts = [
      typeof message === 'string' ? message : '',
      actionUrl ? `Lien : ${actionUrl}` : '',
      formality?.company_name ? `Formalité : ${formality.company_name} (#${formality.id})` : '',
    ].filter((part) => part && part.trim().length > 0);
    const fallbackText = fallbackTextParts.join('\n\n') || 'Notification Greffissimo';

    const textContent = output.text && output.text.trim().length > 0 ? output.text : fallbackText;
    const htmlContent = output.html || wrapEmail(`<p style="font-size:16px;color:#111827;line-height:1.7;margin:0">${escapeHtml(fallbackText)}</p>`);
    const effectiveSubject = output.subject || subject || 'Notification Greffissimo';

    const payload: Record<string, unknown> = {
      personalizations: [
        {
          to: recipients.map((email: string) => ({ email })),
          subject: effectiveSubject,
        },
      ],
      from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent },
      ],
    };

    const REPLY_TO = Deno.env.get('SENDGRID_REPLY_TO_EMAIL');
    if (REPLY_TO && emailRegex.test(REPLY_TO)) {
      (payload as any).reply_to = { email: REPLY_TO };
    }

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
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
    console.error('[supabase/send-email] error', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});
