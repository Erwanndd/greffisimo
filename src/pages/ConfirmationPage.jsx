import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Compte validé !",
      description: "Votre inscription est confirmée. Vous pouvez maintenant vous connecter.",
      className: "bg-green-500 text-white",
    });

    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-16 h-16 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">Confirmation réussie !</h1>
        <p className="text-gray-300 mb-6">Votre compte a été validé avec succès.</p>
        <p className="text-gray-400">Vous allez être redirigé vers la page de connexion...</p>
      </motion.div>
    </div>
  );
};

export default ConfirmationPage;