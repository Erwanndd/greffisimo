import { supabase } from '@/lib/customSupabaseClient';

export const sendEmailNotification = async ({ formality, subject, message, uploader, adminEmails }) => {
  if (!supabase) {
    console.warn("Supabase not connected. Email simulation.");
    return;
  }

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { formality, subject, message, uploader, adminEmails },
    });

    if (error) throw error;
    
    console.log("Notification email sent successfully.");
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw new Error("Impossible d'envoyer l'e-mail de notification.");
  }
};