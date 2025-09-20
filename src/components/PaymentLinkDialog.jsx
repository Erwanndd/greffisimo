import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createCheckoutSession, recordPaymentLink } from '@/services/api/paymentService';
import { sendEmailNotification } from '@/services/NotificationService';
import { getStripePriceIdForFormality } from '@/config/stripePrices';

const PaymentLinkDialog = ({ open, onOpenChange, formality, defaultEmail, onEmailSent }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail || '');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [generatedSessionId, setGeneratedSessionId] = useState('');
  const isValidEmail = (val) => typeof val === 'string' && /.+@.+\..+/.test(val);
  const amount = useMemo(() => formality?.tariff?.amount || formality?.amount || 0, [formality]);
  const currency = 'eur';

  const handleGenerate = async () => {
    try {
      setLoading(true);
      console.log('[PaymentLinkDialog] Generating link', { formalityId: formality?.id, amount, currency, email });
      const priceId = getStripePriceIdForFormality(formality);
      if (!priceId) {
        throw new Error('Aucun Stripe Price ID par défaut configuré. Définissez VITE_STRIPE_PRICE_ID_DEFAULT.');
      }
      console.log('[PaymentLinkDialog] Using priceId', { priceId });
      const { url, sessionId } = await createCheckoutSession({ formalityId: formality.id, amount, currency, customerEmail: email, priceId });
      try {
        await recordPaymentLink({ formalityId: formality.id, sessionId, url, amount, currency, customerEmail: email });
      } catch (e) {
        console.warn('Impossible d\'enregistrer le lien de paiement:', e);
      }
      toast({ title: 'Lien généré', description: `Le lien de paiement a été généré.` });
      setGeneratedUrl(url);
      setGeneratedSessionId(sessionId);
      console.log('[PaymentLinkDialog] Link generated. Waiting for explicit email send');
      // Keep dialog open to display and optionally send
    } catch (err) {
      console.error('Erreur génération envoi lien:', err);
      toast({ title: 'Erreur', description: err.message || 'Impossible de générer/envoyer le lien.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      if (!generatedUrl) {
        toast({ title: 'Lien manquant', description: "Veuillez générer le lien avant l'envoi.", variant: 'destructive' });
        return;
      }
      if (!isValidEmail(email)) {
        toast({ title: 'E-mail invalide', description: "Veuillez saisir une adresse e-mail valide.", variant: 'destructive' });
        return;
      }
      setSending(true);
      const subject = `Lien de paiement - ${formality.company_name}`;
      const message = `Bonjour,\n\nVeuillez procéder au paiement de votre formalité via le lien ci-dessous.`;
      console.log('[PaymentLinkDialog] Sending email', { to: email, sessionId: generatedSessionId });
      await sendEmailNotification({
        formality,
        subject,
        message,
        uploader: null,
        adminEmails: [email],
        template: 'payment_link',
        actionUrl: generatedUrl,
        actionLabel: 'Payer maintenant',
        meta: { amount, currency }
      });
      toast({ title: 'Lien envoyé', description: `Le lien de paiement a été envoyé à ${email}.` });
      onEmailSent && onEmailSent({ url: generatedUrl, sessionId: generatedSessionId, email, amount, currency });
    } catch (err) {
      console.error('Erreur envoi email:', err);
      toast({ title: 'Erreur', description: err.message || "Impossible d'envoyer l'e-mail.", variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle>Action requise: envoi du lien de paiement</DialogTitle>
          <DialogDescription className="text-gray-300">
            Aucun paiement Stripe enregistré pour cette formalité. Envoyez le lien de paiement au client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-sm text-gray-300">Adresse e-mail du client</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" className="bg-white/5 border-white/20 text-white" />
          {/* Prix calculé côté serveur via Stripe Price ID par défaut */}
          {generatedUrl && (
            <div className="mt-2 p-2 bg-white/5 border border-white/10 rounded text-sm">
              <div className="text-gray-300 mb-1">Lien de paiement généré:</div>
              <a href={generatedUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline break-all">{generatedUrl}</a>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-300">Fermer</Button>
          <Button onClick={handleGenerate} disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-500">
            {loading ? 'Génération…' : 'Générer le lien'}
          </Button>
          <Button onClick={handleSendEmail} disabled={!generatedUrl || sending || !isValidEmail(email)} className="bg-gradient-to-r from-green-500 to-teal-500">
            {sending ? 'Envoi…' : 'Envoyer par e-mail'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDialog;
