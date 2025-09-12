import React from 'react';

const FormalityProgress = ({ formality, getStatusProgress }) => (
  <div>
    <div className="flex justify-between text-sm text-gray-300 mb-2">
      <span>Progression du dossier</span>
      <span>{Math.round(getStatusProgress(formality.status))}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-3">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" style={{ width: `${getStatusProgress(formality.status)}%` }}></div>
    </div>
  </div>
);

export default FormalityProgress;