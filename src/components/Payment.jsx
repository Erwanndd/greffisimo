import React from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard } from 'lucide-react';

const Payment = ({ formality }) => {
  const stripe = useStripe();
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!stripe) {
      toast({ title: "Erreur", description: "Stripe n'est pas encore prêt. Veuillez réessayer dans un instant.", variant: "destructive" });
      return;
    }

    // This is a placeholder. I'll replace it with your actual price ID when you provide it.
    const priceId = 'YOUR_PRICE_ID';
    
    if (priceId === 'YOUR_PRICE_ID') {
        toast({ title: "Configuration requise", description: "Veuillez fournir votre ID de prix Stripe pour activer le paiement.", variant: "destructive" });
        return;
    }

    try {
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        successUrl: `${window.location.origin}/formality/${formality.id}?payment=success`,
        cancelUrl: `${window.location.origin}/formality/${formality.id}?payment=cancel`,
      });

      if (error) {
        throw error;
      }
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