import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, Loader2 } from 'lucide-react';

const FormalityChat = ({ formalityId }) => {
  const { messages, fetchMessages, sendMessage, users } = useData();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatMessages = messages[formalityId] || [];
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      await fetchMessages(formalityId);
      setLoading(false);
    };
    if (user) {
      loadMessages();
    }
  }, [formalityId, fetchMessages, user]);

  useEffect(() => {
    if (!loading && chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    await sendMessage(formalityId, newMessage);
    setNewMessage('');
  };

  const getAuthorDisplay = (senderId) => {
    const sender = users.find(u => u.id === senderId);

    if (!sender || !user) {
      return { name: 'Chargement...', role: '', avatar: '?' };
    }

    if (sender.id === user.id) {
        return { name: 'Vous', role: '', avatar: user?.first_name?.charAt(0).toUpperCase() || 'V' };
    }
    
    // Client view: Anonymize formalists and admins
    if (user.role === 'client') {
      if (sender.role === 'formalist') {
        return { name: 'Formaliste Greffissimo', role: 'Formaliste', avatar: 'F' };
      }
      if (sender.role === 'admin') {
        return { name: 'Administrateur Greffissimo', role: 'Admin', avatar: 'A' };
      }
    }
    
    // Admin/Formalist view: Show full names for colleagues
    if (user.role === 'admin' || user.role === 'formalist') {
      let displayName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim();
      let displayRole = sender.role.charAt(0).toUpperCase() + sender.role.slice(1);
      
      if (sender.role === 'formalist') {
        return { name: displayName, role: 'Formaliste', avatar: displayName.charAt(0).toUpperCase() };
      }
      if (sender.role === 'admin') {
        return { name: displayName, role: 'Admin', avatar: displayName.charAt(0).toUpperCase() };
      }
    }

    let displayName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim();
    if (!displayName) {
        return { name: 'Utilisateur inconnu', role: '', avatar: 'U' };
    }

    const displayRole = 'Client';
    const avatar = displayName.charAt(0).toUpperCase();

    return {
      name: displayName,
      role: displayRole,
      avatar: avatar
    };
  };

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center"><MessageSquare className="w-5 h-5 mr-2" />Messagerie</CardTitle>
        <CardDescription className="text-gray-300">Échangez avec les parties prenantes du dossier.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 flex flex-col">
          <div className="flex-grow overflow-y-auto pr-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : chatMessages.length > 0 ? (
              chatMessages.map((msg) => {
                const isCurrentUser = msg.sender_id === user?.id;
                const author = getAuthorDisplay(msg.sender_id);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {author.avatar}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold">
                          {author.name} 
                          {author.role && <span className="text-gray-400 font-normal"> ({author.role})</span>}
                        </p>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400">
                <p>Aucun message pour le moment. Soyez le premier à en envoyer un !</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <Input
              type="text"
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500"
            />
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormalityChat;