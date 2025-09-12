import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'En attente',
      audit: 'Audit du dossier',
      pieces: 'Collecte des pièces',
      payment: 'Paiement',
      fiscal_registration: 'Enregistrement fiscal',
      parutions: 'Parutions légales',
      saisie: 'Saisie du dossier',
      validation: 'Validation par le greffe'
    };
    return statusLabels[status] || status;
};

export const getStatusColor = (status) => {
    const statusColors = {
      pending: 'status-pending',
      audit: 'status-in-progress',
      pieces: 'status-in-progress',
      payment: 'status-in-progress',
      fiscal_registration: 'status-in-progress',
      parutions: 'status-in-progress',
      saisie: 'status-in-progress',
      validation: 'status-completed'
    };
    return statusColors[status] || 'status-pending';
};