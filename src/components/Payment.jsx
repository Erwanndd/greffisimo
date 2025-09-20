import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard } from 'lucide-react';
import { createCheckoutSession } from '@/services/api/paymentService';
import { getStripePriceIdForFormality } from '@/config/stripePrices';

const Payment = ({ formality }) => {
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      const priceId = getStripePriceIdForFormality(formality);
      if (!priceId) {
        toast({ title: 'Configuration manquante', description: 'VITE_STRIPE_PRICE_ID_DEFAULT non défini.', variant: 'destructive' });
        return;
      }
      const { url } = await createCheckoutSession({ formalityId: formality.id, amount: formality?.amount, currency: 'eur', customerEmail: undefined, priceId });
      if (!url) throw new Error('URL de paiement indisponible');
      window.location.href = url;
    } catch (error) {
      console.error("Erreur de paiement Stripe:", error);
      toast({ title: "Erreur de paiement", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Button onClick={handlePayment} className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
      <CreditCard className="w-4 h-4 mr-2" />
      Procéder au paiement
    </Button>
  );
};

export default Payment;
