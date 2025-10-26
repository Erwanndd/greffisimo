import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import FaqPage from '@/pages/FaqPage';
import ClientDashboard from '@/pages/ClientDashboard';
import FormalistDashboard from '@/pages/FormalistDashboard';
import MessagesPage from '@/pages/MessagesPage';
import FormalityDetails from '@/pages/FormalityDetails';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import CheckoutCancel from '@/pages/CheckoutCancel';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === 'formalist') return '/formalist';
    if (user?.role === 'client') return '/client';
    return '/client';
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const milestones = [
    { title: "Déposez votre formalité en 3 clics" },
    { title: "Votre dossier est immédiatement traité par un(e) de nos formalistes professionnel(le)s" },
    { title: "Ne relancez plus votre formaliste : vous recevez des notifications en temps réel !" },
    { title: "Ne faites plus l’intermédiaire pour le paiement : nous envoyons le lien et la facture à votre client" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${
        scrolled 
          ? 'bg-slate-900/80 backdrop-blur-xl shadow-2xl border-b border-slate-800/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <button 
              onClick={() => navigate('/')} 
              className="flex items-center space-x-3 group relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white">G</span>
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-300">
                Greffissimo
              </span>
            </button>

            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-10">
              <button
                onClick={() => navigate('/')}
                className="relative text-slate-300 hover:text-white font-medium transition-all duration-300 group"
              >
                Accueil
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => navigate('/faq')}
                className="relative text-slate-300 hover:text-white font-medium transition-all duration-300 group"
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => navigate(isAuthenticated ? getDashboardPath() : '/login')}
                className="relative px-8 py-3 font-medium text-white overflow-hidden rounded-full group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-transform duration-300 group-hover:scale-110"></span>
                <span className="relative flex items-center">
                {isAuthenticated ? 'Tableau de bord' : 'Commencer'}
                  <ChevronRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
            {/* Mobile */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl transition-all duration-500 ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-6 py-6 space-y-4">
            <button 
              onClick={() => { setIsMenuOpen(false); navigate('/'); }} 
              className="block w-full text-left font-medium text-slate-300 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
            >
              Accueil
            </button>
            <button 
              onClick={() => { setIsMenuOpen(false); navigate('/faq'); }} 
              className="block w-full text-left font-medium text-slate-300 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
            >
              FAQ
            </button>
            <button 
              onClick={() => { setIsMenuOpen(false); navigate(isAuthenticated ? getDashboardPath() : '/login'); }}
              className="block w-full text-left font-medium text-slate-300 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
            >
              {isAuthenticated ? 'Tableau de bord' : 'Commencer'}
              </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 -right-20 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Simplifiez vos démarches juridiques
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-8">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-300">
                Formalités pour
              </span>
              <br />
              <span className="text-white">
                professionnels du droit
              </span>
              <br />
              <span className="text-slate-400">
                et du chiffre
              </span>
            </h1>

            <div className="mt-12 flex flex-col items-center gap-6 w-full">
              <div className="w-full max-w-3xl rounded-3xl overflow-hidden border border-slate-700/70 bg-slate-950/40 shadow-2xl">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src="videos/greffissimo-course.mp4"
                    title="Greffissimo - Présentation vidéo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="group relative inline-flex items-center px-10 py-4 font-semibold text-white overflow-hidden rounded-full"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 group-hover:scale-110"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  Commencer
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={20} />
                </span>
              </button>
            </div>

            {/* Stats */}
          </div>
        </div>
      </header>

      {/* Pourquoi Greffissimo ? */}
      <section className="px-6 py-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <span className="text-xs font-medium text-blue-400">Notre mission</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Pourquoi
              </span>{" "}
              <span className="text-white">Greffissimo ?</span>
            </h2>
            <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
              <p className="pl-4 border-l-2 border-blue-500/30">
                Chez Greffissimo, nous connaissons parfaitement les contraintes des professionnels du droit et du chiffre : délais serrés,
                exigences strictes et dossiers sans marge d'erreur.
              </p>
              <p className="pl-4 border-l-2 border-purple-500/30">
                Notre mission : vous offrir une prise en charge rapide et fiable de vos formalités, tout en vous libérant du temps
                pour vous concentrer sur votre véritable cœur de métier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nos engagements */}
      <section className="px-6 py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950/50"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <span className="text-xs font-medium text-purple-400">Nos valeurs</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Nos engagements
              </span>
            </h3>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-slate-700/30 pointer-events-none"></div>
            <div className="space-y-10">
              {milestones.map((step, index) => (
                <div key={index} className="relative pl-16 sm:pl-20">
                  <div className="absolute left-0 sm:left-2 top-1.5 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <h4 className="text-xl font-semibold text-white">{step.title}</h4>
                    {step.description && (
                      <p className="mt-2 text-slate-300 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

     
     

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <h4 className="text-xl font-bold mb-8 text-white">Plan du site :</h4>
          <ul className="space-y-4">
            {[
              { text: "Accueil", action: () => navigate('/') },
              { text: "FAQ", action: () => navigate('/faq') }
            ].map((item, index) => (
              <li key={index}>
                <button 
                  onClick={item.action} 
                  className="text-slate-400 hover:text-blue-400 transition-all duration-300 group inline-flex items-center"
                >
                  <span className="underline decoration-slate-700 hover:decoration-blue-400/60 transition-all duration-300">
                    {item.text}
                  </span>
                  <ChevronRight className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </li>
            ))}
            <li>
              <a 
                href="/mentions-legales" 
                className="text-slate-400 hover:text-blue-400 transition-all duration-300 group inline-flex items-center"
              >
                <span className="underline decoration-slate-700 hover:decoration-blue-400/60 transition-all duration-300">
                  Mentions légales
                </span>
                <ChevronRight className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </a>
            </li>
          </ul>
        </div>
      </footer>

      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        
        .bg-300 {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Public-only route: redirect authenticated users to their dashboard
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    const target = user?.role === 'formalist' ? '/formalist' : '/client';
    return <Navigate to={target} replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/client" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
      <Route path="/formalist" element={<ProtectedRoute><FormalistDashboard /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/formality/:id" element={<ProtectedRoute><FormalityDetails /></ProtectedRoute>} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/checkout/cancel" element={<CheckoutCancel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
