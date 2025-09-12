import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const CheckoutCancel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const formalityId = Number(params.get('formalityId'));

  return (
    <Layout title="Paiement annulé">
      <div className="max-w-2xl mx-auto">
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <XCircle className="w-6 h-6 text-red-400 mr-3" />
              Paiement annulé
            </CardTitle>
            <CardDescription className="text-gray-300">
              Le paiement a été annulé. Vous pouvez réessayer plus tard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-200">
            <div className="pt-2">
              {formalityId ? (
                <Button onClick={() => navigate(`/formality/${formalityId}`)} className="bg-gradient-to-r from-blue-500 to-purple-500">
                  Retourner à la formalité
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

export default CheckoutCancel;

