import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FormalityClientsEditor({ formality, user, allUsers, onAddClients, onRemoveClient }) {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const clientIdsInFormality = new Set((formality.clients || []).filter(Boolean).map(c => c.id));

  const allClientsByEmail = useMemo(() => {
    const map = new Map();
    (allUsers || []).filter(u => u.role === 'client').forEach(u => map.set((u.email || '').toLowerCase(), u));
    return map;
  }, [allUsers]);

  const canRemove = (clientId) => {
    const total = (formality.clients || []).filter(Boolean).length;
    if (total <= 1) return false; // always keep at least one client
    if (clientId === user.id) return false; // don't allow removing yourself
    return true;
  };

  const handleAddByEmail = () => {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) return;
    const valid = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(normalized);
    if (!valid) {
      toast({ title: 'Email invalide', description: 'Veuillez saisir une adresse e‑mail valide.', variant: 'destructive' });
      return;
    }
    const profile = allClientsByEmail.get(normalized);
    if (!profile) {
      toast({ title: 'Utilisateur introuvable', description: "Cette adresse n'est pas associée à un utilisateur. Invitez votre collègue à créer un compte, puis réessayez.", variant: 'destructive' });
      return;
    }
    if (clientIdsInFormality.has(profile.id)) {
      toast({ title: 'Déjà présent', description: 'Ce collègue fait déjà partie du dossier.' });
      return;
    }
    onAddClients([profile.id]);
    setEmail('');
  };

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center"><Users className="w-5 h-5 mr-2" />Collaborateurs (clients)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-gray-300 text-sm">Participants actuels :</p>
          <div className="flex flex-wrap gap-2">
            {(formality.clients || []).filter(Boolean).map(c => (
              <div key={c.id} className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 text-white text-sm">
                <span>{c.first_name} {c.last_name}</span>
                {canRemove(c.id) && (
                  <button
                    type="button"
                    className="text-red-300 hover:text-red-200"
                    onClick={() => onRemoveClient(c.id)}
                    title="Retirer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Ajouter un collègue par e‑mail</Label>
          <div className="flex gap-2 max-w-xl">
            <Input
              type="email"
              placeholder="prenom.nom@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
            <Button onClick={handleAddByEmail} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">Ajouter</Button>
          </div>
          <p className="text-xs text-gray-400">Si votre collègue n’a pas encore de compte, invitez‑le d’abord, puis ajoutez son e‑mail.</p>
        </div>
        <p className="text-xs text-gray-400">Vous ne pouvez pas vous retirer vous‑même ni laisser le dossier sans client.</p>
      </CardContent>
    </Card>
  );
}
