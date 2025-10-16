import { supabase } from '@/lib/customSupabaseClient';
import { handleSupabaseError, getProfileById, getParticipantEmails, getProfileByEmail } from './utils';
import { sendEmailNotification } from '../NotificationService';
import { getStatusLabel } from '@/lib/utils';
import { DEFAULT_FORMALIST_EMAIL } from '@/config/appConfig';

export const createFormalityInDB = async (formalityData, clientIds, user) => {
    let formalistId = formalityData.formalist_id;
    if (!formalistId) {
        const defaultFormalist = await getProfileByEmail(DEFAULT_FORMALIST_EMAIL);
        if (!defaultFormalist) {
            throw new Error(`Aucun formaliste trouvé pour l'e-mail configuré: ${DEFAULT_FORMALIST_EMAIL}`);
        }
        formalistId = defaultFormalist.id;
    }

    const insertPayload = { ...formalityData, formalist_id: formalistId, created_by: user.id };
    if (insertPayload.invoice_entity === '') {
        insertPayload.invoice_entity = null;
    }

    const { data: formality, error: formalityError } = await supabase
        .from('formalities')
        .insert([insertPayload])
        .select()
        .single();
    handleSupabaseError({ error: formalityError, customMessage: 'creating formality' });
    
    if (clientIds && clientIds.length > 0) {
        const clientLinks = clientIds.map(clientId => ({
            formality_id: formality.id,
            client_id: clientId,
        }));
        const { error: clientError } = await supabase.from('formality_clients').insert(clientLinks);
        handleSupabaseError({ error: clientError, customMessage: 'linking clients to formality' });
    }

    const { error: historyError } = await supabase
        .from('history')
        .insert([{ formality_id: formality.id, action: `Création de la formalité.`, author_id: user.id }]);
    handleSupabaseError({ error: historyError, customMessage: 'logging formality creation' });
    
    const { data: fullFormalityData, error: getFormalityError } = await supabase
      .from('formalities')
      .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
      .eq('id', formality.id)
      .single();
    handleSupabaseError({ error: getFormalityError, customMessage: 'fetching new formality for notification' });

    const formalityWithClients = { ...fullFormalityData, clients: fullFormalityData.clients.map(c => c.profile) };
    const recipientEmails = getParticipantEmails(formalityWithClients, user.id);

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouvelle formalité créée : ${formalityWithClients.company_name}`,
      message: `Une nouvelle formalité a été créée par ${user.first_name} ${user.last_name}.`,
      uploader: user,
      adminEmails: recipientEmails
    });

    return formality;
};


export const updateFormalityInDB = async (id, updates, user) => {
    const { data: oldFormality, error: fetchError } = await supabase
        .from('formalities')
        .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
        .eq('id', id)
        .single();
    console.log('Fetch error', fetchError);
    console.log('Old formality', oldFormality);
    handleSupabaseError({ error: fetchError, customMessage: 'fetching formality for update' });

    const { data: updatedFormality, error: updateError } = await supabase
        .from('formalities')
        .update(updates)
        .eq('id', id)
        .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
        .single();
    console.log('Updated formality', updateError);
    handleSupabaseError({ error: updateError, customMessage: 'updating formality' });
    
    let historyAction = 'Mise à jour de la formalité.';
    let sendNotification = false;
    let notificationSubject = '';
    let notificationMessage = '';
    
    if (updates.status && updates.status !== oldFormality.status) {
        const translatedNewStatus = getStatusLabel(updates.status);
        historyAction = `Statut changé de "${getStatusLabel(oldFormality.status)}" à "${translatedNewStatus}".`;
        sendNotification = true;
        notificationSubject = `Mise à jour du statut pour ${updatedFormality.company_name}`;
        notificationMessage = `Le statut de la formalité est passé à "${translatedNewStatus}".`;
    } else if (updates.formalist_id && updates.formalist_id !== oldFormality.formalist_id) {
        const formalist = await getProfileById(updates.formalist_id);
        historyAction = `Formaliste assigné à ${formalist.first_name} ${formalist.last_name}.`;
    }

    const { error: historyError } = await supabase
        .from('history')
        .insert([{ formality_id: id, action: historyAction, author_id: user.id }]);
    handleSupabaseError({ error: historyError, customMessage: 'logging formality update' });
    
    if (sendNotification) {
      const formalityWithClients = { ...updatedFormality, clients: updatedFormality.clients.map(c => c.profile) };
      const recipientEmails = getParticipantEmails(formalityWithClients, user.id);
      await sendEmailNotification({
        formality: formalityWithClients,
        subject: notificationSubject,
        message: notificationMessage,
        uploader: user,
        adminEmails: recipientEmails
      });
    }

    return updatedFormality;
};

export const deleteFormalityFromDB = async (id, user) => {
    const { data: formality, error: fetchError } = await supabase
      .from('formalities')
      .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
      .eq('id', id).single();
    handleSupabaseError({ error: fetchError, customMessage: 'fetching formality for deletion notification' });

    const { error: clientError } = await supabase.from('formality_clients').delete().eq('formality_id', id);
    handleSupabaseError({ error: clientError, customMessage: 'deleting formality client links' });

    const { error: historyError } = await supabase.from('history').delete().eq('formality_id', id);
    handleSupabaseError({ error: historyError, customMessage: 'deleting formality history' });

    const { error: messagesError } = await supabase.from('messages').delete().eq('formality_id', id);
    handleSupabaseError({ error: messagesError, customMessage: 'deleting formality messages' });

    const { error } = await supabase.from('formalities').delete().eq('id', id);
    handleSupabaseError({ error, customMessage: 'deleting formality' });

    if (formality) {
      const formalityWithClients = { ...formality, clients: formality.clients.map(c => c.profile) };
      const recipientEmails = getParticipantEmails(formalityWithClients, user.id);
      await sendEmailNotification({
        formality: formalityWithClients,
        subject: `Suppression de la formalité : ${formality.company_name}`,
        message: `La formalité a été supprimée par ${user.first_name} ${user.last_name}.`,
        uploader: user,
        adminEmails: recipientEmails
      });
    }
};

export const addClientsToFormalityInDB = async (formalityId, clientIds, user) => {
    if (!clientIds || clientIds.length === 0) return [];
    const rows = clientIds.map(clientId => ({ formality_id: formalityId, client_id: clientId }));

    // Use upsert to avoid duplicates if a unique constraint exists
    const { data, error } = await supabase
        .from('formality_clients')
        .upsert(rows, { onConflict: 'formality_id,client_id', ignoreDuplicates: true })
        .select();
    handleSupabaseError({ error, customMessage: 'adding clients to formality' });

    const { data: formalityData, error: getFormalityError } = await supabase
      .from('formalities')
      .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
      .eq('id', formalityId)
      .single();
    handleSupabaseError({ error: getFormalityError, customMessage: 'fetching formality for client add notification' });

    const formalityWithClients = { ...formalityData, clients: formalityData.clients.map(c => c.profile) };
    const recipientEmails = getParticipantEmails(formalityWithClients, user.id);

    await supabase.from('history').insert([{ formality_id: formalityId, action: `Client(s) ajouté(s).`, author_id: user.id }]);

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouveau(x) client(s) ajouté(s) à ${formalityWithClients.company_name}`,
      message: `${clientIds.length} client(s) ont été ajouté(s) à la formalité par ${user.first_name} ${user.last_name}.`,
      uploader: user,
      adminEmails: recipientEmails
    });

    return data || [];
};

export const removeClientFromFormalityInDB = async (formalityId, clientId, user) => {
    const { error } = await supabase
        .from('formality_clients')
        .delete()
        .eq('formality_id', formalityId)
        .eq('client_id', clientId);
    handleSupabaseError({ error, customMessage: 'removing client from formality' });

    await supabase.from('history').insert([{ formality_id: formalityId, action: `Client supprimé.`, author_id: user.id }]);

    const { data: formalityData, error: getFormalityError } = await supabase
      .from('formalities')
      .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
      .eq('id', formalityId)
      .single();
    handleSupabaseError({ error: getFormalityError, customMessage: 'fetching formality for client remove notification' });

    const formalityWithClients = { ...formalityData, clients: formalityData.clients.map(c => c.profile) };
    const recipientEmails = getParticipantEmails(formalityWithClients, user.id);

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Client supprimé de ${formalityWithClients.company_name}`,
      message: `Un client a été supprimé de la formalité par ${user.first_name} ${user.last_name}.`,
      uploader: user,
      adminEmails: recipientEmails
    });
};
