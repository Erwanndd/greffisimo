import { supabase } from '@/lib/customSupabaseClient';

export const sendEmailNotification = async ({ formality, subject, message, uploader, adminEmails, template, actionUrl, actionLabel, meta }) => {
  if (!supabase) {
    console.warn("Supabase not connected. Email simulation.");
    return;
  }

  try {
    console.log('[Notification] Invoking send-email function', { subject, recipients: adminEmails, hasFormality: !!formality });
    const { error } = await supabase.functions.invoke('send-email', {
      body: { formality, subject, message, uploader, adminEmails, template, actionUrl, actionLabel, meta },
    });

    if (error) throw error;
    console.log("[Notification] Email sent successfully.");
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw new Error("Impossible d'envoyer l'e-mail de notification.");
  }
};
