import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

const FormalityHistory = ({ formalityHistory, getAuthorDisplay }) => (
  <Card className="glass-effect border-white/20">
    <CardHeader>
      <CardTitle className="text-white flex items-center"><History className="w-5 h-5 mr-2" />Historique</CardTitle>
      <CardDescription className="text-gray-300">Suivi des modifications</CardDescription>
    </CardHeader>
    <CardContent>
      {formalityHistory.length > 0 ? (
        <div className="space-y-4">
          {formalityHistory.map((entry) => (
            <div key={entry.id} className="border-l-2 border-blue-500 pl-4 pb-4 relative">
              <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-slate-800"></div>
              <p className="text-white text-sm font-medium">{entry.action}</p>
              <p className="text-gray-400 text-xs">
                Par {getAuthorDisplay(entry.author)} • {new Date(entry.timestamp).toLocaleDateString('fr-FR')} à {new Date(entry.timestamp).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun historique disponible</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default FormalityHistory;