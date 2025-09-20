import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MultiSelect from '@/components/shared/MultiSelect';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Clock, CheckCircle, Search, Loader2, Filter, ChevronDown, Scale, FileType, Bell } from 'lucide-react';
import FormalityList from '@/components/shared/FormalityList';
import { formalityTypes } from '@/lib/constants';

const FormalistDashboard = () => {
  const { formalities, updateFormality, getStatusLabel, tribunals, loading, unreadMessagesCount } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [tribunalFilter, setTribunalFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);

  const myFormalities = useMemo(() => formalities.filter(f => f.formalist_id === user.id), [formalities, user.id]);

  const filteredFormalities = useMemo(() => myFormalities.filter(formality => {
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
  }), [myFormalities, searchTerm, statusFilter, tribunalFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: myFormalities.length,
    pending: myFormalities.filter(f => f.status === 'pending_payment').length,
    inProgress: myFormalities.filter(f => ['paid', 'formalist_processing', 'greffe_processing'].includes(f.status)).length,
    completed: myFormalities.filter(f => f.status === 'validated').length
  }), [myFormalities]);


  const handleStatusUpdate = (formalityId, newStatus) => {
    updateFormality(formalityId, { status: newStatus });
    toast({
      title: "Statut mis à jour",
      description: `Le statut a été mis à jour vers "${getStatusLabel(newStatus)}"`
    });
  };

  const statusOptions = [
    { value: 'pending_payment', label: 'En attente de paiement' },
    { value: 'paid', label: 'Payé' },
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

  return (
    <Layout title="Espace Formaliste">
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
              <p className="text-gray-300">Gérez et suivez l'avancement des formalités qui vous sont assignées.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Mes Formalités</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{loading ? <Loader2 className="w-6 h-6 animate-spin"/> : stats.total}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">En attente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{loading ? <Loader2 className="w-6 h-6 animate-spin"/> : stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">En cours</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{loading ? <Loader2 className="w-6 h-6 animate-spin"/> : stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Finalisées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{loading ? <Loader2 className="w-6 h-6 animate-spin"/> : stats.completed}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-4 items-center"
        >
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par société, SIREN ou type..."
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
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Mes Formalités ({filteredFormalities.length})</CardTitle>
              <CardDescription className="text-gray-300">
                Formalités qui vous sont assignées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                 <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-white mb-2">Chargement des formalités...</h3>
                  </div>
              ) : (
                <FormalityList 
                  formalities={filteredFormalities} 
                  userRole="formalist"
                  onStatusUpdate={handleStatusUpdate}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default FormalistDashboard;
