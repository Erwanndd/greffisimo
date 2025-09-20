import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const getStatusLabel = (status) => {
  const statusLabels = {
    pending_payment: 'En attente de paiement',
    paid: 'Payé',
    formalist_processing: 'Traitement par le formaliste',
    greffe_processing: 'Traitement par le greffe',
    validated: 'Dossier validé',
  };
  return statusLabels[status] || status;
};

export const getStatusColor = (status) => {
  const statusColors = {
    pending_payment: 'status-pending',
    paid: 'status-in-progress',
    formalist_processing: 'status-in-progress',
    greffe_processing: 'status-in-progress',
    validated: 'status-completed',
  };
  return statusColors[status] || 'status-pending';
};
