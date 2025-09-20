import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Receipt } from 'lucide-react';

const FormalityHeader = ({ formality, getStatusLabel, getStatusColor }) => (
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-white text-2xl">{formality.company_name}</CardTitle>
        <CardDescription className="text-gray-300 text-lg">{formality.type}</CardDescription>
      </div>
      <div className="flex items-center space-x-3">
        {formality.is_urgent && (
          <span className="flex items-center text-red-500 text-sm font-semibold bg-red-500/10 px-3 py-1 rounded-full">
            <Flame className="w-4 h-4 mr-1.5" />
            Urgent
          </span>
        )}
        {formality.requires_tax_registration && (
          <span className="flex items-center text-amber-400 text-sm font-semibold bg-amber-400/10 px-3 py-1 rounded-full">
            <Receipt className="w-4 h-4 mr-1.5" />
            Enregistrement fiscal
          </span>
        )}
        <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(formality.status)}`}>
          {getStatusLabel(formality.status)}
        </span>
      </div>
    </div>
  </CardHeader>
);

export default FormalityHeader;
