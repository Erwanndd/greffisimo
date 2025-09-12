import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Flame, Scale, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FormalityList = ({ formalities, userRole, onStatusUpdate, children }) => {
  const { getStatusLabel, getStatusColor, unreadFormalityIds } = useData();
  const navigate = useNavigate();

  const getClientNames = (clients) => {
    if (!clients || clients.length === 0) return 'Aucun client';
    return clients.filter(c => c).map(c => `${c.first_name} ${c.last_name}`).join(', ');
  };

  const getFormalistName = (formalist) => {
    if (!formalist) return 'Non assigné';
    return `${formalist.first_name} ${formalist.last_name}`;
  };

  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'audit', label: 'Audit du dossier' },
    { value: 'pieces', label: 'Collecte des pièces' },
    { value: 'payment', label: 'Paiement' },
    { value: 'fiscal_registration', label: 'Enregistrement fiscal' },
    { value: 'parutions', label: 'Parutions légales' },
    { value: 'saisie', label: 'Saisie du dossier' },
    { value: 'validation', label: 'Validation par le greffe' }
  ];

  return (
    <div className="space-y-4">
      {formalities.map((formality) => (
        <motion.div
          key={formality.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.2 }}
          className={`p-4 rounded-lg bg-white/5 border ${formality.is_urgent ? 'border-red-500/50' : 'border-white/10'} hover:bg-white/10 transition-colors`}
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
                Créé le {new Date(formality.created_at).toLocaleDateString('fr-FR')} • 
                Mis à jour le {new Date(formality.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/formality/${formality.id}`)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Détails
              </Button>
              {onStatusUpdate && (
                <Select
                  value={formality.status}
                  onValueChange={(value) => onStatusUpdate(formality.id, value)}
                >
                  <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-colors">
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
               {children && children(formality)}
            </div>
          </div>
        </motion.div>
      ))}
      {formalities.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>Aucune formalité trouvée avec les critères sélectionnés.</p>
        </div>
      )}
    </div>
  );
};

export default FormalityList;