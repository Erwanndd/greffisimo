import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Flame, Scale, MessageSquare, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaymentLinkDialog from '@/components/PaymentLinkDialog';
import { hasPaymentLinkForFormality } from '@/services/api/paymentService';

const FormalityList = ({ formalities, userRole, onStatusUpdate, children }) => {
  const { getStatusLabel, getStatusColor, unreadFormalityIds } = useData();
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [dialogFormality, setDialogFormality] = useState(null);

  const getClientNames = (clients) => {
    if (!clients || clients.length === 0) return 'Aucun client';
    return clients.filter(c => c).map(c => `${c.first_name} ${c.last_name}`).join(', ');
  };

  const getFormalistName = (formalist) => {
    if (!formalist) return 'Non assigné';
    return `${formalist.first_name} ${formalist.last_name}`;
  };

  const statusOptions = [
    { value: 'pending_payment', label: 'En attente de paiement' },
    { value: 'paid', label: 'Payé' },
    { value: 'formalist_processing', label: 'Traitement par le formaliste' },
    { value: 'greffe_processing', label: 'Traitement par le greffe' },
    { value: 'validated', label: 'Dossier validé' },
  ];

  const handleStatusSelect = async (formality, newStatus) => {
    console.log('[FormalityList] Requested status change', { formalityId: formality.id, newStatus });
    if (newStatus === 'pending_payment') {
      // Always open the dialog; status is updated only after the email is sent
      setDialogFormality(formality);
      setShowPaymentDialog(true);
      return;
    }
    onStatusUpdate && onStatusUpdate(formality.id, newStatus);
  };

  const handleCardKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/formality/${id}`);
    }
  };

  return (
    <div className="space-y-4">
      {formalities.map((formality) => (
        <motion.div
          key={formality.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2 }}
          className={`p-4 rounded-lg bg-white/5 border ${formality.is_urgent ? 'border-red-500/50' : 'border-white/10'} hover:bg-white/10 transition-colors cursor-pointer`}
          onClick={() => navigate(`/formality/${formality.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => handleCardKeyDown(e, formality.id)}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <div className="flex items-center space-x-4 mb-2">
                <h3 className="font-semibold text-white">{formality.company_name}</h3>
                {unreadFormalityIds.includes(formality.id) && (
                  <MessageSquare className="w-4 h-4 text-blue-400 animate-pulse" />
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(formality.status)}`}>
                  {getStatusLabel(formality.status)}
                </span>
                {formality.is_urgent && (
                  <span className="flex items-center text-red-500 text-xs font-semibold">
                    <Flame className="w-4 h-4 mr-1" />
                    Urgent
                  </span>
                )}
                {formality.requires_tax_registration && (
                  <span className="flex items-center text-amber-400 text-xs font-semibold">
                    <Receipt className="w-4 h-4 mr-1" />
                    Enregistrement fiscal
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                <div><span className="font-medium">SIREN:</span> {formality.siren || 'N/A'}</div>
                <div><span className="font-medium">Type:</span> {formality.type}</div>
                {userRole === 'admin' && (
                  <>
                    <div><span className="font-medium">Clients:</span> {getClientNames(formality.clients)}</div>
                    <div><span className="font-medium">Formaliste:</span> {getFormalistName(formality.formalist)}</div>
                  </>
                )}
                 {formality.tribunal && (
                    <div className="flex items-center space-x-1">
                        <Scale className="w-3 h-3 text-gray-400" />
                        <span>{formality.tribunal.name}</span>
                    </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Créé le {formality.created_at ? new Date(formality.created_at).toLocaleDateString('fr-FR') : 'N/A'} • 
                Dernière mise à jour le {formality.last_updated_at ? new Date(formality.last_updated_at).toLocaleDateString('fr-FR') : 'N/A'}
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); navigate(`/formality/${formality.id}`); }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Détails
              </Button>
              {onStatusUpdate && (
                <Select
                  value={formality.status}
                  onValueChange={(value) => handleStatusSelect(formality, value)}
                >
                  <SelectTrigger
                    className="w-full md:w-48 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
               {children && (
                 <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                   {children(formality)}
                 </div>
               )}
            </div>
          </div>
        </motion.div>
      ))}
      {formalities.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>Aucune formalité trouvée avec les critères sélectionnés.</p>
        </div>
      )}
      {showPaymentDialog && dialogFormality && (
        <PaymentLinkDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          formality={dialogFormality}
          defaultEmail={(dialogFormality.clients && dialogFormality.clients[0]?.email) || ''}
          onEmailSent={() => {
            console.log('[FormalityList] onEmailSent → setting status to pending_payment', { formalityId: dialogFormality.id });
            onStatusUpdate && onStatusUpdate(dialogFormality.id, 'pending_payment');
          }}
        />
      )}
    </div>
  );
};

export default FormalityList;
