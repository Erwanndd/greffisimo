import { supabase } from '@/lib/customSupabaseClient';
import { handleSupabaseError, slugify, getParticipantEmails } from './utils';
import { sendEmailNotification } from '../NotificationService';

export const addDocumentToFormalityInDB = async (formalityId, file, user) => {
    const fileName = `${Date.now()}_${slugify(file.name)}`;
    const filePath = `${formalityId}/${user.id}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            // Use a safe default to avoid bucket MIME restrictions
            contentType: 'application/octet-stream',
        });
    handleSupabaseError({ error: uploadError, customMessage: 'uploading document' });

    // Store originalName in userMetadata
    const { error: updateMetaError } = await supabase.storage
      .from('documents')
      .update(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/octet-stream',
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
    const recipientEmails = getParticipantEmails(formalityWithClients, user.id);

    await sendEmailNotification({
      formality: formalityWithClients,
      subject: `Nouveau document pour ${formalityWithClients.company_name}`,
      message: `Un nouveau document "${file.name}" a été ajouté à la formalité par ${user.first_name} ${user.last_name}.`,
      uploader: user,
      adminEmails: recipientEmails
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
          const metadata = file.metadata || {};
          allFiles.push({ ...file, fullPath, user_metadata: metadata.userMetadata });
        }
      }
    }
  }

  const signingPromises = allFiles.map(file => 
    supabase.storage.from('documents').createSignedUrl(file.fullPath, 3600)
  );
  
  const signedUrlResults = await Promise.allSettled(signingPromises);

  return allFiles.map((file, index) => {
    const urlResult = signedUrlResults[index];
    const signedUrl = (urlResult.status === 'fulfilled' && !urlResult.value.error) ? urlResult.value.data.signedUrl : null;
    
    return { 
      ...file, 
      displayName: file?.user_metadata?.originalName || file.name, 
      signedUrl 
    };
  }).filter(doc => doc.signedUrl);
};
