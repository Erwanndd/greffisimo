import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Edit, CreditCard, Loader2 } from 'lucide-react';
import Payment from '@/components/Payment';
import FormalityHeader from '@/components/formality/FormalityHeader';
import FormalityProgress from '@/components/formality/FormalityProgress';
import FormalityInfo from '@/components/formality/FormalityInfo';
import FormalityStatusUpdate from '@/components/formality/FormalityStatusUpdate';
import FormalityDocuments from '@/components/formality/FormalityDocuments';
import FormalityHistory from '@/components/formality/FormalityHistory';
import FormalityChat from '@/components/formality/FormalityChat';

const FormalityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formalities, history, tribunals, documents, updateFormality, addDocumentToFormality, fetchDocumentsForFormality, getStatusLabel, getStatusColor } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showAddDocDialog, setShowAddDocDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const formalityId = parseInt(id);
  const formality = formalities.find(f => f.id === formalityId);
  const formalityHistory = history.filter(h => h.formality_id === formalityId);
  const formalityDocuments = documents[formalityId] || [];
  
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('payment') === 'success') {
      toast({
        title: "Paiement réussi !",
        description: "Votre paiement a été traité avec succès. La formalité va maintenant continuer son cours.",
        className: "bg-green-500 text-white",
      });
      if (formality && formality.status === 'payment') {
        updateFormality(formality.id, { status: 'paid' });
      }
    }
    if (query.get('payment') === 'cancel') {
      toast({
        title: "Paiement annulé",
        description: "Le processus de paiement a été annulé. Vous pouvez réessayer à tout moment.",
        variant: "destructive",
      });
    }
  }, [location.search, toast, updateFormality, formality]);

  const fetchDocuments = useCallback(async () => {
    if (!formalityId) return;
    setDocumentsLoading(true);
    await fetchDocumentsForFormality(formalityId);
    setDocumentsLoading(false);
  }, [formalityId, fetchDocumentsForFormality]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (!formality) {
    return (
      <Layout title="Formalité introuvable">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Formalité introuvable</h2>
          <p className="text-gray-300 mb-6">La formalité demandée n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
          <Button onClick={() => navigate(-1)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </Layout>
    );
  }

  const canEdit = user.role === 'admin' || (user.role === 'formalist' && formality.formalist_id === user.id);
  
  const isUserClientOfFormality = formality.clients && formality.clients.some(c => c && c.id === user.id);

  const canView = user.role === 'admin' || 
                  (user.role === 'formalist' && formality.formalist_id === user.id) ||
                  (user.role === 'client' && isUserClientOfFormality);

  const canUploadDocument = user.role === 'admin' || 
                            (user.role === 'formalist' && formality.formalist_id === user.id) ||
                            (user.role === 'client' && isUserClientOfFormality);

  if (!canView) {
    return (
      <Layout title="Accès refusé">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Accès refusé</h2>
          <p className="text-gray-300 mb-6">Vous n'avez pas les permissions pour accéder à cette formalité.</p>
          <Button onClick={() => navigate(-1)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </Layout>
    );
  }

  const formalist = formality.formalist;

  const handleStatusUpdate = (newStatus) => {
    updateFormality(formality.id, { status: newStatus });
    toast({
      title: "Statut mis à jour",
      description: `Le statut a été mis à jour vers "${getStatusLabel(newStatus)}"`
    });
  };

  const handleTribunalUpdate = (tribunalId) => {
    updateFormality(formality.id, { tribunal_id: parseInt(tribunalId) });
    const tribunal = tribunals.find(t => t.id === parseInt(tribunalId));
    toast({
      title: "Tribunal mis à jour",
      description: `Le tribunal a été assigné à "${tribunal.name}"`
    });
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleAddDocument = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({ title: "Erreur", description: "Veuillez sélectionner au moins un fichier à téléverser.", variant: "destructive" });
      return;
    }
    try {
      for (const file of selectedFiles) {
        // Upload sequentially to avoid any storage MIME quirks under concurrency
        // and to better surface per-file errors if they occur.
        await addDocumentToFormality(formality.id, file);
      }
      toast({ title: "Téléversement terminé", description: `${selectedFiles.length} fichier(s) envoyé(s).` });
    } finally {
      setSelectedFiles([]);
      setShowAddDocDialog(false);
    }
  };
  
  const handleDownloadDocument = (document) => {
    if (document.signedUrl) {
      window.open(document.signedUrl, '_blank');
    } else {
      toast({
        title: "Lien de document non disponible",
        variant: "destructive"
      });
    }
  };

  const getStatusProgress = (status) => {
    const statusOrder = ['pending', 'audit', 'pieces', 'payment', 'paid', 'fiscal_registration', 'parutions', 'saisie', 'validation'];
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };
  
  const getRoleLabel = (role) => {
    if (!role) return 'Utilisateur';
    const labels = {
      admin: 'Administrateur',
      formalist: 'Formaliste',
      client: 'Client',
    };
    return labels[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getAuthorDisplay = (author) => {
    if (!author) return 'Système';
    const roleLabel = getRoleLabel(author.role);
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name} (${roleLabel})`;
    }
    return roleLabel;
  };

  return (
    <Layout title={`Formalité - ${formality.company_name}`}>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className={`glass-effect border ${formality.is_urgent ? 'border-red-500/50' : 'border-white/20'}`}>
              <FormalityHeader formality={formality} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />
              <CardContent className="space-y-6">
                <FormalityProgress formality={formality} getStatusProgress={getStatusProgress} />
                
                {formality.status === 'payment' && user.role === 'client' && (
                  <Card className="bg-blue-900/30 border-blue-500">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <CreditCard className="w-5 h-5 mr-3 text-blue-400" />
                        Paiement requis
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Votre formalité est prête pour le paiement. Veuillez procéder pour continuer le traitement de votre dossier.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Payment formality={formality} />
                    </CardContent>
                  </Card>
                )}

                <FormalityInfo formality={formality} user={user} formalist={formalist} />
                <FormalityStatusUpdate 
                  formality={formality} 
                  canEdit={canEdit} 
                  handleStatusUpdate={handleStatusUpdate} 
                  handleTribunalUpdate={handleTribunalUpdate} 
                  getStatusLabel={getStatusLabel} 
                  tribunals={tribunals} 
                />
              </CardContent>
            </Card>

            <FormalityChat formalityId={formality.id} />

            <FormalityDocuments 
              formality={formality}
              canUploadDocument={canUploadDocument}
              documents={formalityDocuments}
              documentsLoading={documentsLoading}
              handleFileSelect={handleFileSelect}
              handleAddDocument={handleAddDocument}
              handleDownloadDocument={handleDownloadDocument}
              showAddDocDialog={showAddDocDialog}
              setShowAddDocDialog={setShowAddDocDialog}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
          </div>

          <div>
            <FormalityHistory formalityHistory={formalityHistory} getAuthorDisplay={getAuthorDisplay} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default FormalityDetails;
