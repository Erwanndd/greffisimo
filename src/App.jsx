import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import CheckoutCancel from '@/pages/CheckoutCancel';
// Admin dashboard removed (no administrator concept)
import FormalistDashboard from '@/pages/FormalistDashboard';
import ClientDashboard from '@/pages/ClientDashboard';
import FormalityDetails from '@/pages/FormalityDetails';
import MessagesPage from '@/pages/MessagesPage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

function ProtectedRoute({ children, allowedRoles }) {
  const { session, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
          <h1 className="text-2xl font-bold text-white">Chargement...</h1>
          <p className="text-gray-300">Veuillez patienter.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { session, user, loading } = useAuth();
  
  const getDashboardRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'formalist':
        return '/formalist';
      case 'client':
        return '/client';
      default:
        return '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
          <h1 className="text-2xl font-bold text-white">Chargement...</h1>
          <p className="text-gray-300">Veuillez patienter.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        session ? <Navigate to={getDashboardRoute()} replace /> : <LoginPage />
      } />
      
      {null}
      
      <Route path="/formalist" element={
        <ProtectedRoute allowedRoles={['formalist']}>
          <FormalistDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/client" element={
        <ProtectedRoute allowedRoles={['client']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />
      
      <Route path="/formality/:id" element={
        <ProtectedRoute>
          <FormalityDetails />
        </ProtectedRoute>
      } />
      
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/cancel" element={<CheckoutCancel />} />
      
      <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
      
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Accès non autorisé</h1>
            <p className="text-gray-300">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Helmet>
        <title>Greffissimo - Simplifiez vos formalités juridiques</title>
        <meta name="description" content="Greffissimo : Simplifiez vos formalités juridiques avec notre plateforme de suivi en temps réel." />
        <meta property="og:title" content="Greffissimo - Simplifiez vos formalités juridiques" />
        <meta property="og:description" content="Greffissimo : Simplifiez vos formalités juridiques avec notre plateforme de suivi en temps réel." />
      </Helmet>
      
      <DataProvider>
        <Elements stripe={stripePromise}>
          <div className="min-h-screen w-full">
            <AppRoutes />
          </div>
        </Elements>
      </DataProvider>
      <Toaster />
    </Router>
  );
}

export default App;
