import { supabase } from '@/lib/customSupabaseClient';
import { handleSupabaseError, getParticipantEmails } from './utils';
import { sendEmailNotification } from '../NotificationService';


export const fetchMessagesForFormality = async (formalityId) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('formality_id', formalityId)
        .order('created_at', { ascending: true });
    handleSupabaseError({ error, customMessage: 'fetching messages' });
    return data;
};

export const sendMessageInDB = async (formalityId, content, sender) => {
    const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert([{ formality_id: formalityId, content, sender_id: sender.id }])
        .select()
        .single();
    handleSupabaseError({ error: insertError, customMessage: 'sending message' });

    const { data: formalityData, error: getFormalityError } = await supabase
        .from('formalities')
        .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
        .eq('id', formalityId)
        .single();
    handleSupabaseError({ error: getFormalityError, customMessage: 'fetching formality for notification' });

    const formalityWithClients = { ...formalityData, clients: formalityData.clients.map(c => c.profile) };
    const recipientEmails = getParticipantEmails(formalityWithClients, sender.id);

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouveau message pour ${formalityWithClients.company_name}`,
      message: `Un nouveau message a été ajouté à la formalité par ${sender.first_name} ${sender.last_name}: "${content}"`,
      uploader: sender,
      adminEmails: recipientEmails
    });

    return newMessage;
};

export const getUnreadMessagesCountForUser = async (userId) => {
  const { data: unreadMessages, error: unreadError } = await supabase
    .rpc('get_unread_messages_for_user', { p_user_id: userId });
  
  if (unreadError) {
    console.error("Error calling RPC function 'get_unread_messages_for_user':", unreadError.message);
    return [];
  }
  
  return unreadMessages || [];
};

export const markMessagesAsReadForUser = async (formalityId, userId) => {
    const { data: messagesToMark, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('formality_id', formalityId)
        .neq('sender_id', userId);

    if (messagesError) {
        handleSupabaseError({ error: messagesError, customMessage: 'fetching messages to mark as read' });
        return;
    }

    if (messagesToMark.length === 0) return;

    const readStatuses = messagesToMark.map(m => ({
        message_id: m.id,
        user_id: userId,
        read_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
        .from('message_read_status')
        .upsert(readStatuses, { onConflict: 'message_id, user_id' });
    
    handleSupabaseError({ error: upsertError, customMessage: 'marking messages as read' });
};
