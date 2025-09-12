import React from 'react';
import { Building, FileText, Users, User, Calendar, Scale } from 'lucide-react';

const FormalityInfo = ({ formality, user, formalist }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-4">
      <div className="flex items-center space-x-3"><Building className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-gray-400">SIREN</p><p className="text-white font-medium">{formality.siren || 'N/A'}</p></div></div>
      <div className="flex items-center space-x-3"><FileText className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-gray-400">Type de formalité</p><p className="text-white font-medium">{formality.type}</p></div></div>
      <div className="flex items-center space-x-3"><Scale className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-gray-400">Tribunal compétent</p><p className="text-white font-medium">{formality.tribunal ? formality.tribunal.name : 'Non assigné'}</p></div></div>
    </div>
    <div className="space-y-4">
      <div className="flex items-start space-x-3"><Users className="w-5 h-5 text-blue-400 mt-1" /><div><p className="text-sm text-gray-400">Clients</p><p className="text-white font-medium">{formality.clients && formality.clients.length > 0 ? formality.clients.filter(c => c).map(c => `${c.first_name} ${c.last_name}`).join(', ') : 'Aucun client'}</p></div></div>
      {user.role === 'admin' && (<div className="flex items-center space-x-3"><User className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-gray-400">Formaliste assigné</p><p className="text-white font-medium">{formalist ? `${formalist.first_name} ${formalist.last_name}` : 'Non assigné'}</p></div></div>)}
    </div>
    <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-gray-400">Date de création</p><p className="text-white font-medium">{new Date(formality.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>
    <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-blue-400" /><div><p className="text-sm text-gray-400">Dernière mise à jour</p><p className="text-white font-medium">{new Date(formality.updated_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div></div>
  </div>
);

export default FormalityInfo;