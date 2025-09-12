import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import FormalityList from '@/components/shared/FormalityList';

const ClientFormalityList = ({ formalities, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-white mb-2">Chargement des formalités...</h3>
      </div>
    );
  }

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Mes Formalités ({formalities.length})</CardTitle>
        <CardDescription className="text-gray-300">
          Suivi en temps réel de vos dossiers juridiques
        </CardDescription>
      </CardHeader>
      <CardContent>
        {formalities.length > 0 ? (
          <FormalityList formalities={formalities} userRole="client" />
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucune formalité en cours</h3>
            <p className="text-gray-400">
              Vos formalités juridiques apparaîtront ici une fois créées par votre administrateur.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientFormalityList;