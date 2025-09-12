import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';

const FormalityStatusUpdate = ({ formality, canEdit, handleStatusUpdate, handleTribunalUpdate, tribunals }) => {
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

  const groupedTribunals = tribunals.reduce((acc, tribunal) => {
    const type = tribunal.type || 'Autre';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(tribunal);
    return acc;
  }, {});

  Object.keys(groupedTribunals).forEach(type => {
    groupedTribunals[type].sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    canEdit && (
      <div className="border-t border-white/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-white font-medium mb-3">Mettre à jour le statut</h4>
          <Select value={formality.status} onValueChange={handleStatusUpdate}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <h4 className="text-white font-medium mb-3">Assigner un tribunal</h4>
          <Select value={formality.tribunal_id?.toString()} onValueChange={handleTribunalUpdate}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-blue-500 focus:ring-blue-500"><SelectValue placeholder="Choisir un tribunal" /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20 max-h-60 overflow-y-auto">
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
        </div>
      </div>
    )
  );
};

export default FormalityStatusUpdate;