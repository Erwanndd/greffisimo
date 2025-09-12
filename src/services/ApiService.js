import { supabase } from '@/lib/customSupabaseClient';
import { sendEmailNotification } from './NotificationService';

const handleSupabaseError = ({ error, customMessage }) => {
  if (error) {
    console.error(`Supabase error in ${customMessage}:`, error);
    throw new Error(`${customMessage}. ${error.message}`);
  }
};

const slugify = (str) => {
  if (!str) return '';
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrssssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return str.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

const getProfileById = async (id) => {
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  handleSupabaseError({ error, customMessage: 'fetching profile' });
  return data;
};

const getAdminEmails = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin');

  handleSupabaseError({ error, customMessage: 'fetching admin emails' });
  return data.map(profile => profile.email);
};

export const fetchAllData = async (user) => {
    let formalityQuery = supabase.from('formalities').select(`
        *,
        formalist:profiles!formalist_id(*),
        clients:formality_clients!formality_id(profile:profiles!client_id(*)),
        creator:profiles!created_by(*),
        tribunal:tribunals(*),
        tariff:tariffs(*)
    `).order('created_at', { ascending: false });

    let relevantFormalityIds = [];

    if (user.role === 'formalist') {
        formalityQuery = formalityQuery.eq('formalist_id', user.id);
    } else if (user.role === 'client') {
        const { data: clientFormalities, error: clientFormalitiesError } = await supabase
            .from('formality_clients')
            .select('formality_id')
            .eq('client_id', user.id);
        handleSupabaseError({ error: clientFormalitiesError, customMessage: 'fetching client formalities' });
        const formalityIds = clientFormalities.map(cf => cf.formality_id);
        formalityQuery = formalityQuery.in('id', formalityIds);
    }

    const { data: formalities, error: formalitiesError } = await formalityQuery;
    handleSupabaseError({ error: formalitiesError, customMessage: 'fetching formalities' });

    relevantFormalityIds = formalities.map(f => f.id);

    const transformedFormalities = formalities.map(f => ({
        ...f,
        clients: f.clients.map(c => c.profile)
    }));
    
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
    handleSupabaseError({ error: profilesError, customMessage: 'fetching profiles' });
    
    let historyQuery = supabase.from('history').select(`
      *,
      author:profiles(*)
    `).order('timestamp', { ascending: false });

    if (user.role !== 'admin') {
      historyQuery = historyQuery.in('formality_id', relevantFormalityIds);
    }
    
    const { data: history, error: historyError } = await historyQuery;
    handleSupabaseError({ error: historyError, customMessage: 'fetching history' });

    return { formalities: transformedFormalities, users: profiles, history };
};


export const createFormalityInDB = async (formalityData, clientIds, user) => {
    const { data: formality, error: formalityError } = await supabase
        .from('formalities')
        .insert([{ ...formalityData, created_by: user.id }])
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
    const adminEmails = await getAdminEmails();

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouvelle formalité créée : ${formalityWithClients.company_name}`,
      message: `Une nouvelle formalité a été créée par ${user.first_name} ${user.last_name}.`,
      uploader: user,
      adminEmails: adminEmails
    });

    return formality;
};


export const updateFormalityInDB = async (id, updates, user) => {
    const { data: oldFormality, error: fetchError } = await supabase
        .from('formalities')
        .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
        .eq('id', id)
        .single();
    handleSupabaseError({ error: fetchError, customMessage: 'fetching formality for update' });

    const { data: updatedFormality, error: updateError } = await supabase
        .from('formalities')
        .update(updates)
        .eq('id', id)
        .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
        .single();
    handleSupabaseError({ error: updateError, customMessage: 'updating formality' });
    
    let historyAction = 'Mise à jour de la formalité.';
    let sendNotification = false;
    let notificationSubject = '';
    let notificationMessage = '';
    
    if (updates.status && updates.status !== oldFormality.status) {
        historyAction = `Statut changé de "${oldFormality.status}" à "${updates.status}".`;
        sendNotification = true;
        notificationSubject = `Mise à jour du statut pour ${updatedFormality.company_name}`;
        notificationMessage = `Le statut de la formalité est passé à "${updates.status}".`;
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
      const adminEmails = await getAdminEmails();
      
      await sendEmailNotification({
        formality: formalityWithClients,
        subject: notificationSubject,
        message: notificationMessage,
        uploader: user,
        adminEmails: adminEmails
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
      const adminEmails = await getAdminEmails();

      await sendEmailNotification({
        formality: formalityWithClients,
        subject: `Suppression de la formalité : ${formality.company_name}`,
        message: `La formalité a été supprimée par ${user.first_name} ${user.last_name}.`,
        uploader: user,
        adminEmails: adminEmails
      });
    }
};

export const addDocumentToFormalityInDB = async (formalityId, file, user) => {
    const fileName = `${Date.now()}_${slugify(file.name)}`;
    const filePath = `${formalityId}/${user.id}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
            duplex: 'half'
        });
    handleSupabaseError({ error: uploadError, customMessage: 'uploading document' });

    const { error: updateMetaError } = await supabase.storage
      .from('documents')
      .update(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Use update, so upsert should be false
        contentType: file.type,
        duplex: 'half',
        userMetadata: {
          originalName: file.name
        }
      });
    handleSupabaseError({ error: updateMetaError, customMessage: 'updating document metadata' });

    const { error: historyError } = await supabase.from('history').insert([
        { formality_id: formalityId, action: `Document "${file.name}" ajouté.`, author_id: user.id },
    ]);
    handleSupabaseError({ error: historyError, customMessage: 'logging document upload' });
    
    const { data: formalityData, error: getFormalityError } = await supabase
        .from('formalities')
        .select(`*, formalist:profiles!formalist_id(*), clients:formality_clients!formality_id(profile:profiles!client_id(*))`)
        .eq('id', formalityId)
        .single();
    handleSupabaseError({ error: getFormalityError, customMessage: 'fetching formality for notification' });

    const formalityWithClients = { ...formalityData, clients: formalityData.clients.map(c => c.profile) };
    const adminEmails = await getAdminEmails();

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouveau document pour ${formalityWithClients.company_name}`,
      message: `Un nouveau document "${file.name}" a été ajouté à la formalité par ${user.first_name} ${user.last_name}.`,
      uploader: user,
      adminEmails: adminEmails
    });

    return { ...uploadData, fullPath: filePath, originalName: file.name };
};

export const getDocumentsForFormality = async (formalityId) => {
  if (!formalityId) return [];

  const { data: userFolders, error: userFoldersError } = await supabase.storage
    .from('documents')
    .list(`${formalityId}/`);

  if (userFoldersError) {
    handleSupabaseError({ error: userFoldersError, customMessage: `listing user folders for formality ${formalityId}` });
    return [];
  }

  const allFiles = [];
  for (const userFolder of userFolders) {
    if (!userFolder.name.startsWith('.')) { // Ignore system files like .emptyFolderPlaceholder
      const { data: files, error: filesError } = await supabase.storage
        .from('documents')
        .list(`${formalityId}/${userFolder.name}`);
      
      if (filesError) {
        console.error(`Error listing files for user folder ${userFolder.name}:`, filesError);
        continue;
      }

      for (const file of files) {
         if (!file.name.startsWith('.')) {
          const fullPath = `${formalityId}/${userFolder.name}/${file.name}`;
          allFiles.push({ ...file, fullPath });
        }
      }
    }
  }

  const signingPromises = allFiles.map(file => 
    supabase.storage.from('documents').createSignedUrl(file.fullPath, 3600)
  );
  
  const metadataPromises = allFiles.map(file =>
    supabase.storage.from('documents').getPublicUrl(file.fullPath)
      .data.publicUrl.includes(file.name) ?
      supabase.storage.from('documents').update(file.fullPath, new Blob(), { userMetadata: { originalName: file.name } })
      .then(() => supabase.storage.from('documents').list(file.fullPath.substring(0, file.fullPath.lastIndexOf('/')), { search: file.name }))
      .then(listResult => listResult.data[0])
      : Promise.resolve(file)
  );

  const signedUrlResults = await Promise.allSettled(signingPromises);
  const metadataResults = await Promise.allSettled(allFiles.map(file =>
    supabase.storage.from('documents').getPublicUrl(file.fullPath).data.publicUrl
      ? supabase.storage.from('documents').list(file.fullPath.substring(0, file.fullPath.lastIndexOf('/')), { search: file.name })
      : Promise.resolve({ data: [file] })
  ));

  return allFiles.map((file, index) => {
    const urlResult = signedUrlResults[index];
    const metaResult = metadataResults[index];
    
    const signedUrl = (urlResult.status === 'fulfilled' && !urlResult.value.error) ? urlResult.value.data.signedUrl : null;
    const fileWithMeta = (metaResult.status === 'fulfilled' && metaResult.value.data.length > 0) ? metaResult.value.data[0] : file;

    return { 
      ...file, 
      ...fileWithMeta,
      displayName: fileWithMeta?.user_metadata?.originalName || file.name, 
      signedUrl 
    };
  }).filter(doc => doc.signedUrl);
};


export const fetchTribunals = async () => {
    const { data, error } = await supabase.from('tribunals').select('*');
    handleSupabaseError({ error, customMessage: 'fetching tribunals' });
    return data;
};

export const fetchTariffs = async () => {
    const { data, error } = await supabase.from('tariffs').select('*');
    handleSupabaseError({ error, customMessage: 'fetching tariffs' });
    return data;
};

export const updateUserInDB = async (id, updates) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id);
    handleSupabaseError({ error, customMessage: 'updating user' });
    return data;
};

export const createUserInDB = (userData) => {
    throw new Error("La création d'utilisateur se fait via l'inscription Supabase Auth.");
};

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
    const adminEmails = await getAdminEmails();

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouveau message pour ${formalityWithClients.company_name}`,
      message: `Un nouveau message a été ajouté à la formalité par ${sender.first_name} ${sender.last_name}: "${content}"`,
      uploader: sender,
      adminEmails: adminEmails
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