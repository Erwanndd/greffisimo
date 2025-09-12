import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formalities, updateFormality } = useData();

  const params = new URLSearchParams(location.search);
  const formalityId = Number(params.get('formalityId'));
  const sessionId = params.get('session_id');

  const formality = formalities.find(f => f.id === formalityId);

  useEffect(() => {
    if (formality && formality.status === 'payment') {
      // Set to paid optimistically; webhook will also enforce
      updateFormality(formality.id, { status: 'paid' });
    }
  }, [formality, updateFormality]);

  return (
    <Layout title="Paiement réussi">
      <div className="max-w-2xl mx-auto">
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <CheckCircle2 className="w-6 h-6 text-green-400 mr-3" />
              Paiement confirmé
            </CardTitle>
            <CardDescription className="text-gray-300">
              Merci, votre paiement a bien été pris en compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-200">
            {formalityId && (
              <div>
                <span className="font-medium">Formalité:</span> #{formalityId} {formality ? `- ${formality.company_name}` : ''}
              </div>
            )}
            {sessionId && (
              <div className="text-sm text-gray-400">Session Stripe: {sessionId}</div>
            )}
            <div className="pt-2">
              {formalityId ? (
                <Button onClick={() => navigate(`/formality/${formalityId}`)} className="bg-gradient-to-r from-blue-500 to-purple-500">
                  Voir la formalité
                </Button>
              ) : (
                <Button onClick={() => navigate(-1)}>Retour</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CheckoutSuccess;

