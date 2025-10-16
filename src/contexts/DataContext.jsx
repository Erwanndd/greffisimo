import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { fetchAllData } from '@/services/api/dataService';
import { createFormalityInDB, updateFormalityInDB, deleteFormalityFromDB, addClientsToFormalityInDB, removeClientFromFormalityInDB } from '@/services/api/formalityService';
import { addDocumentToFormalityInDB, getDocumentsForFormality as getDocumentsFromApi, deleteDocumentFromFormalityInDB } from '@/services/api/documentService';
import { updateUserInDB, createUserInDB } from '@/services/api/userService';
import { fetchMessagesForFormality, sendMessageInDB, getUnreadMessagesCountForUser, markMessagesAsReadForUser } from '@/services/api/messageService';
import { fetchTribunals, fetchTariffs } from '@/services/api/dataService';
import { getStatusLabel, getStatusColor } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [formalities, setFormalities] = useState([]);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [tribunals, setTribunals] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [messages, setMessages] = useState({});
  const [documents, setDocuments] = useState({});
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadFormalityIds, setUnreadFormalityIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const unreadMessages = await getUnreadMessagesCountForUser(user.id);
      setUnreadMessagesCount(unreadMessages.length);
      const ids = [...new Set(unreadMessages.map(m => m.formality_id))];
      setUnreadFormalityIds(ids);
    } catch (error) {
      console.error("Error fetching unread messages count:", error);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ formalities, users, history }, tribunalsData, tariffsData] = await Promise.all([
        fetchAllData(user),
        fetchTribunals(),
        fetchTariffs()
      ]);
      setFormalities(formalities);
      setUsers(users);
      setHistory(history);
      setTribunals(tribunalsData);
      setTariffs(tariffsData);
      await fetchUnreadCount();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Erreur de chargement", description: `Impossible de récupérer les données: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, toast, fetchUnreadCount]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (isAuthenticated && user) {
      fetchData();
    } else {
      setLoading(false);
      setFormalities([]);
      setUsers([]);
      setHistory([]);
      setTribunals([]);
      setTariffs([]);
      setMessages({});
      setDocuments({});
      setUnreadMessagesCount(0);
      setUnreadFormalityIds([]);
    }
  }, [fetchData, isAuthenticated, user, authLoading]);

  const fetchDocumentsForFormality = useCallback(async (formalityId) => {
    if (!formalityId) return;
    try {
      const docs = await getDocumentsFromApi(formalityId);
      setDocuments(prev => ({ ...prev, [formalityId]: docs }));
    } catch (error) {
      console.error(`Error fetching documents for formality ${formalityId}:`, error);
      toast({ title: "Erreur", description: "Impossible de charger les documents.", variant: "destructive" });
      setDocuments(prev => ({ ...prev, [formalityId]: [] }));
    }
  }, [toast]);

  const handleApiCall = async (apiCall, successMessage, refresh = true, ...args) => {
    try {
      const result = await apiCall(...args);
      if (successMessage) {
        toast({ title: "Succès", description: successMessage });
      }
      if (refresh) {
        await fetchData();
      }
      return result;
    } catch (error) {
      console.error(`Error in ${apiCall.name}:`, error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const createFormality = async (formalityData, clientIds) => {
    await handleApiCall(createFormalityInDB, "La formalité a été créée avec succès.", true, formalityData, clientIds, user);
  };

  const updateFormality = async (id, updates) => {
    await handleApiCall(updateFormalityInDB, "La formalité a été mise à jour.", true, id, updates, user);
  };

  const deleteFormality = async (id) => {
    await handleApiCall(deleteFormalityFromDB, "La formalité a été supprimée.", true, id, user);
  };

  const addClientsToFormality = async (formalityId, clientIds) => {
    if (!clientIds || clientIds.length === 0) return;
    try {
      await addClientsToFormalityInDB(formalityId, clientIds, user);
      // Update local state: append new client profiles
      setFormalities(prev => prev.map(f => {
        if (f.id !== formalityId) return f;
        const newClients = users.filter(u => clientIds.includes(u.id));
        const merged = [...(f.clients || []), ...newClients].filter((v, i, a) => v && a.findIndex(x => x.id === v.id) === i);
        return { ...f, clients: merged, last_updated_at: new Date().toISOString() };
      }).sort((a, b) => new Date(b.last_updated_at || 0) - new Date(a.last_updated_at || 0)));
      toast({ title: 'Clients ajoutés', description: `${clientIds.length} collègue(s) ajouté(s).` });
    } catch (error) {
      console.error('Error adding clients:', error);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const removeClientFromFormality = async (formalityId, clientId) => {
    try {
      await removeClientFromFormalityInDB(formalityId, clientId, user);
      setFormalities(prev => prev.map(f => {
        if (f.id !== formalityId) return f;
        const updatedClients = (f.clients || []).filter(c => c && c.id !== clientId);
        return { ...f, clients: updatedClients, last_updated_at: new Date().toISOString() };
      }).sort((a, b) => new Date(b.last_updated_at || 0) - new Date(a.last_updated_at || 0)));
      toast({ title: 'Participant supprimé', description: `Le participant a été retiré du dossier.` });
    } catch (error) {
      console.error('Error removing client:', error);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const addDocumentToFormality = async (formalityId, file) => {
    try {
        await addDocumentToFormalityInDB(formalityId, file, user);
        toast({ title: "Succès", description: `Le document "${file.name}" a été téléversé.` });
        
        await fetchDocumentsForFormality(formalityId);
        
        const newHistoryEntry = {
            id: Date.now(),
            formality_id: formalityId,
            action: `Document "${file.name}" ajouté.`,
            author_id: user.id,
            author: user,
            timestamp: new Date().toISOString()
        };
        setHistory(prev => [newHistoryEntry, ...prev]);

        // Also bump the formality's last_updated_at and reorder locally
        setFormalities(prev => {
          const updated = prev.map(f => f.id === formalityId ? { ...f, last_updated_at: newHistoryEntry.timestamp } : f);
          return updated.sort((a, b) => {
            const da = a.last_updated_at ? new Date(a.last_updated_at).getTime() : 0;
            const db = b.last_updated_at ? new Date(b.last_updated_at).getTime() : 0;
            return db - da;
          });
        });

    } catch (error) {
        console.error(`Error in addDocumentToFormality:`, error);
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
};

  const deleteDocumentFromFormality = async (formalityId, document) => {
    try {
      await deleteDocumentFromFormalityInDB(formalityId, document.fullPath, document.displayName || document.name, user);
      toast({ title: 'Document supprimé', description: `"${document.displayName || document.name}" a été supprimé.` });

      // Optimistic UI: remove from local list
      setDocuments(prev => ({
        ...prev,
        [formalityId]: (prev[formalityId] || []).filter(doc => doc.fullPath !== document.fullPath)
      }));

      const newHistoryEntry = {
        id: Date.now(),
        formality_id: formalityId,
        action: `Document "${document.displayName || document.name}" supprimé.`,
        author_id: user.id,
        author: user,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [newHistoryEntry, ...prev]);

      // Update ordering based on last update
      setFormalities(prev => {
        const updated = prev.map(f => f.id === formalityId ? { ...f, last_updated_at: newHistoryEntry.timestamp } : f);
        return updated.sort((a, b) => {
          const da = a.last_updated_at ? new Date(a.last_updated_at).getTime() : 0;
          const db = b.last_updated_at ? new Date(b.last_updated_at).getTime() : 0;
          return db - da;
        });
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const updateUser = async (id, updates) => {
    await handleApiCall(updateUserInDB, "L'utilisateur a été mis à jour.", true, id, updates);
  };

  const createUser = async (userData) => {
    try {
      createUserInDB(userData);
    } catch (error) {
      toast({ title: "Action non supportée", description: error.message, variant: "destructive" });
    }
  };
  
  const addMessage = useCallback((formalityId, message) => {
    setMessages(prev => {
        const currentMessages = prev[formalityId] || [];
        if (currentMessages.some(m => m.id === message.id)) {
            return prev;
        }
        return {
            ...prev,
            [formalityId]: [...currentMessages, message].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        };
    });
  }, []);

  const fetchMessages = useCallback(async (formalityId) => {
    if (!user) return;
    try {
      const fetchedMessages = await fetchMessagesForFormality(formalityId);
      setMessages(prev => ({ ...prev, [formalityId]: fetchedMessages }));
      await markMessagesAsReadForUser(formalityId, user.id);
      await fetchUnreadCount();
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({ title: "Erreur", description: "Impossible de charger les messages.", variant: "destructive" });
    }
  }, [toast, user, fetchUnreadCount]);

  const sendMessage = async (formalityId, content) => {
    try {
        const newMessage = await sendMessageInDB(formalityId, content, user);
        if (newMessage) {
            addMessage(formalityId, newMessage);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        addMessage(newMessage.formality_id, newMessage);
        if (newMessage.sender_id !== user.id) {
            fetchUnreadCount();
            toast({
                title: "Nouveau message",
                description: `Vous avez un nouveau message dans une de vos formalités.`,
            });
        }
      })
      .subscribe();
      
    const documentsChannel = supabase
      .channel('storage-documents')
      .on('postgres_changes', { event: '*', schema: 'storage', table: 'objects', filter: `bucket_id=eq.documents` }, (payload) => {
        const fullPath = payload.new?.name || payload.old?.name;
        if (fullPath) {
          const pathParts = fullPath.split('/');
          if (pathParts.length > 0) {
            const formalityId = parseInt(pathParts[0], 10);
            if (!isNaN(formalityId) && formalities.some(f => f.id === formalityId)) {
              fetchDocumentsForFormality(formalityId);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(documentsChannel);
    };
  }, [user, addMessage, toast, fetchUnreadCount, fetchDocumentsForFormality, formalities]);

  const value = {
    formalities, users, history, tribunals, tariffs, messages, documents, loading, unreadMessagesCount, unreadFormalityIds,
    updateFormality, createFormality, deleteFormality,
    addClientsToFormality, removeClientFromFormality,
    createUser, updateUser, addDocumentToFormality, deleteDocumentFromFormality,
    fetchMessages, sendMessage, fetchUnreadCount,
    fetchDocumentsForFormality,
    getStatusLabel, getStatusColor, fetchData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
