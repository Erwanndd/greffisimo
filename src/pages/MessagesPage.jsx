import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search, ArrowRight, Flame, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MessagesPage = () => {
  const { user } = useAuth();
  const { formalities, unreadFormalityIds, getStatusLabel, getStatusColor } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const accessibleFormalities = useMemo(() => {
    if (!user) return [];
    if (user.role === 'formalist') {
      return formalities.filter(f => f.formalist_id === user.id);
    }
    if (user.role === 'client') {
      return formalities.filter(f => Array.isArray(f.clients) && f.clients.some(c => c && c.id === user.id));
    }
    return formalities;
  }, [formalities, user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? accessibleFormalities.filter(f =>
          (f.company_name || '').toLowerCase().includes(term) ||
          (f.siren || '').includes(term) ||
          (f.type || '').toLowerCase().includes(term)
        )
      : accessibleFormalities;
    return [...list].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [accessibleFormalities, search]);

  return (
    <Layout title="Messages">
      <div className="space-y-6">
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Conversations
            </CardTitle>
            <CardDescription className="text-gray-300">Sélectionnez un dossier pour ouvrir la messagerie.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par société, SIREN ou type..."
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Aucune formalité trouvée.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate(`/formality/${f.id}`)}
                    className={`w-full text-left p-4 rounded-lg bg-white/5 border ${f.is_urgent ? 'border-red-500/50' : 'border-white/10'} hover:bg-white/10 transition-colors relative`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-white">{f.company_name}</h3>
                          {unreadFormalityIds.includes(f.id) && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">Nouveaux</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(f.status)}`}>
                            {getStatusLabel(f.status)}
                          </span>
                          {f.is_urgent && (
                            <span className="flex items-center text-red-500 text-xs font-semibold">
                              <Flame className="w-4 h-4 mr-1" />
                              Urgent
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-400 flex items-center space-x-3">
                          {f.siren && <span>SIREN: {f.siren}</span>}
                          {f.tribunal && (
                            <span className="flex items-center space-x-1">
                              <Scale className="w-3 h-3 text-gray-400" />
                              <span>{f.tribunal.name}</span>
                            </span>
                          )}
                          <span>Mis à jour le {new Date(f.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                        Ouvrir <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MessagesPage;

