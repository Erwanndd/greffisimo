import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, Search, Bell, Loader2, Filter, ChevronDown, Scale, FileType, Plus, Flame, CreditCard, Info } from 'lucide-react';
import MultiSelect from '@/components/shared/MultiSelect';
import ClientFormalityList from '@/components/client/ClientFormalityList';
import { formalityTypes } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const ClientDashboard = () => {
  const { formalities, users, tribunals, tariffs, loading, unreadMessagesCount, createFormality } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [tribunalFilter, setTribunalFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);

  const filteredFormalities = useMemo(() => {
    return formalities.filter(formality => {
      const matchesSearch = (formality.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (formality.siren || '').includes(searchTerm) ||
                           (formality.type || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(formality.status);
      const matchesTribunal = tribunalFilter.length === 0 || (formality.tribunal_id && tribunalFilter.includes(formality.tribunal_id.toString()));
      const matchesType = typeFilter.length === 0 || typeFilter.includes(formality.type);

      return matchesSearch && matchesStatus && matchesTribunal && matchesType;
    }).sort((a, b) => {
      const da = a.last_updated_at ? new Date(a.last_updated_at).getTime() : 0;
      const db = b.last_updated_at ? new Date(b.last_updated_at).getTime() : 0;
      return db - da;
    });
  }, [formalities, searchTerm, statusFilter, tribunalFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: formalities.length,
    pending: formalities.filter(f => f.status === 'pending_payment').length,
    inProgress: formalities.filter(f => ['formalist_processing', 'greffe_processing'].includes(f.status)).length,
    completed: formalities.filter(f => f.status === 'validated').length
  }), [formalities]);
  
  const statusOptions = [
    { value: 'pending_payment', label: 'En attente de paiement' },
    { value: 'formalist_processing', label: 'Traitement par le formaliste' },
    { value: 'greffe_processing', label: 'Traitement par le greffe' },
    { value: 'validated', label: 'Dossier validé' }
  ];

  const tribunalOptions = tribunals.map(tribunal => ({
    value: tribunal.id.toString(),
    label: tribunal.name
  }));

  const typeOptions = formalityTypes.map(type => ({
    value: type,
    label: type
  }));

  const [showCreateFormality, setShowCreateFormality] = useState(false);
  const [newFormality, setNewFormality] = useState({
    company_name: '',
    siren: '',
    type: '',
    status: 'pending_payment',
    is_urgent: false,
    requires_tax_registration: false,
    tribunal_id: null,
    tariff_id: null
  });
  const [selectedColleagueIds, setSelectedColleagueIds] = useState([]);
  const [colleagueEmail, setColleagueEmail] = useState('');

  const groupedTribunals = tribunals.reduce((acc, tribunal) => {
    const type = tribunal.type || 'Autre';
    if (!acc[type]) acc[type] = [];
    acc[type].push(tribunal);
    return acc;
  }, {});

  const clientsByEmail = (users || [])
    .filter(u => u.role === 'client')
    .reduce((acc, u) => { acc[(u.email || '').toLowerCase()] = u; return acc; }, {});
  const clientsById = (users || [])
    .filter(u => u.role === 'client')
    .reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

  const handleCreateFormality = async () => {
    if (!newFormality.company_name || !newFormality.type || !newFormality.tariff_id) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires (Nom de la société, Type, Tarif)', variant: 'destructive' });
      return;
    }
    const clientIds = Array.from(new Set([user.id, ...selectedColleagueIds]));
    // Build payload with known backend columns only to avoid DB errors
    const payload = {
      company_name: newFormality.company_name,
      siren: newFormality.siren,
      type: newFormality.type,
      status: newFormality.status,
      is_urgent: newFormality.is_urgent,
      requires_tax_registration: newFormality.requires_tax_registration,
      tribunal_id: newFormality.tribunal_id ? parseInt(newFormality.tribunal_id) : null,
      tariff_id: parseInt(newFormality.tariff_id),
    };
    await createFormality(payload, clientIds);

    setNewFormality({ company_name: '', siren: '', type: '', status: 'pending_payment', is_urgent: false, requires_tax_registration: false, tribunal_id: null, tariff_id: null });
    setSelectedColleagueIds([]);
    setColleagueEmail('');
    setShowCreateFormality(false);
  };

  return (
    <Layout title="Espace Client">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect border-white/20 rounded-lg p-6"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg relative"
            >
              <Bell className="w-6 h-6 text-white" />
              {unreadMessagesCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-gray-800">
                  {unreadMessagesCount}
                </div>
              )}
            </motion.div>
            <div>
              <h2 className="text-xl font-semibold text-white">Bienvenue, {user?.first_name} !</h2>
              <p className="text-gray-300">Suivez l'avancement de vos formalités juridiques en temps réel</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Formalités</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.total}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">En attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">En cours</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Finalisées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.completed}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4 items-center"
        >
          <Dialog open={showCreateFormality} onOpenChange={setShowCreateFormality}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Formalité
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Créer une nouvelle formalité</DialogTitle>
                <DialogDescription className="text-gray-300">Remplissez les informations de la nouvelle formalité</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Nom de la société" value={newFormality.company_name} onChange={(e) => setNewFormality({...newFormality, company_name: e.target.value})} className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500" />
                <Input placeholder="SIREN (optionnel)" value={newFormality.siren} onChange={(e) => setNewFormality({...newFormality, siren: e.target.value})} className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500" />

                <Select value={newFormality.type} onValueChange={(value) => setNewFormality({...newFormality, type: value})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500"><SelectValue placeholder="Type de formalité" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {formalityTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={newFormality.tariff_id || ''} onValueChange={(value) => setNewFormality({...newFormality, tariff_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500">
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Sélectionner un tarif" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {tariffs && tariffs.map(tariff => (
                      <SelectItem key={tariff.id} value={tariff.id.toString()}>
                        {tariff.name} - {(tariff.amount / 100).toFixed(2)} €
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={newFormality.tribunal_id || ''} onValueChange={(value) => setNewFormality({...newFormality, tribunal_id: value})}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Sélectionner un tribunal" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {Object.entries(groupedTribunals).map(([type, tribunalsOfType]) => (
                      <SelectGroup key={type}>
                        <SelectLabel className="text-gray-400">{type}</SelectLabel>
                        {tribunalsOfType.map(tribunal => (
                          <SelectItem key={tribunal.id} value={tribunal.id.toString()}>{tribunal.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="urgency-switch"
                    checked={newFormality.is_urgent}
                    onCheckedChange={(checked) => setNewFormality({ ...newFormality, is_urgent: checked })}
                  />
                  <Label htmlFor="urgency-switch" className="flex items-center text-white">
                    <Flame className="w-4 h-4 mr-2" />
                    Urgence
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="tax-reg-switch"
                    checked={newFormality.requires_tax_registration}
                    onCheckedChange={(checked) => setNewFormality({ ...newFormality, requires_tax_registration: checked })}
                  />
                  <Label htmlFor="tax-reg-switch" className="flex items-center text-white">
                    <Info className="w-4 h-4 mr-2" title="par ex. pour les traités de fusion" />
                    Enregistrement fiscal
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Ajouter un collègue (par e‑mail)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="prenom.nom@entreprise.com"
                      type="email"
                      value={colleagueEmail}
                      onChange={(e) => setColleagueEmail(e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const email = (colleagueEmail || '').trim().toLowerCase();
                        if (!email) return;
                        const valid = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
                        if (!valid) {
                          toast({ title: 'Email invalide', description: 'Veuillez saisir une adresse e‑mail valide.', variant: 'destructive' });
                          return;
                        }
                        const userProfile = clientsByEmail[email];
                        if (!userProfile) {
                          toast({ title: 'Utilisateur introuvable', description: "Cette adresse n'est pas associée à un utilisateur. Invitez votre collègue à créer un compte, puis réessayez.", variant: 'destructive' });
                          return;
                        }
                        if (selectedColleagueIds.includes(userProfile.id) || userProfile.id === user.id) {
                          toast({ title: 'Déjà sélectionné', description: 'Ce collègue est déjà ajouté.' });
                          return;
                        }
                        setSelectedColleagueIds(prev => [...prev, userProfile.id]);
                        setColleagueEmail('');
                      }}
                      className="hover:bg-white/10"
                    >
                      Ajouter
                    </Button>
                  </div>
                  {selectedColleagueIds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Collègues ajoutés</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedColleagueIds.map(id => {
                          const profile = clientsById[id];
                          const label = profile
                            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || (profile.email || '')
                            : `Utilisateur #${id}`;
                          const email = profile?.email || '';
                          return (
                            <div key={id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                              <span className="text-sm text-white">{label}</span>
                              {email && <span className="text-xs text-gray-400">{email}</span>}
                              <button
                                type="button"
                                aria-label="Retirer ce collègue"
                                onClick={() => setSelectedColleagueIds(prev => prev.filter(cid => cid !== id))}
                                className="ml-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white px-1"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">Vous êtes automatiquement ajouté comme client.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateFormality(false)} className="hover:bg-white/10 transition-colors">Annuler</Button>
                <Button onClick={handleCreateFormality} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par société, SIREN ou type de formalité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
          
          <MultiSelect
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
            options={statusOptions}
            label="Filtrer par statut"
            trigger={
              <Button variant="outline" className="w-48 bg-white/5 border-white/20 text-white justify-between hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>Statuts ({statusFilter.length || 'Tous'})</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            }
          />
           <MultiSelect
            selectedValues={tribunalFilter}
            onSelectionChange={setTribunalFilter}
            options={tribunalOptions}
            label="Filtrer par tribunal"
            trigger={
              <Button variant="outline" className="w-48 bg-white/5 border-white/20 text-white justify-between hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center">
                  <Scale className="w-4 h-4 mr-2" />
                  <span>Tribunaux ({tribunalFilter.length || 'Tous'})</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            }
          />
          <MultiSelect
            selectedValues={typeFilter}
            onSelectionChange={setTypeFilter}
            options={typeOptions}
            label="Filtrer par type"
            trigger={
              <Button variant="outline" className="w-48 bg-white/5 border-white/20 text-white justify-between hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center">
                  <FileType className="w-4 h-4 mr-2" />
                  <span>Types ({typeFilter.length || 'Tous'})</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ClientFormalityList formalities={filteredFormalities} loading={loading} />
        </motion.div>
      </div>
    </Layout>
  );
};

export default ClientDashboard;
