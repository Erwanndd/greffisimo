import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Shield, Clock, CheckCircle, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { VideoPlayer } from '@/components/ui/video-thumnail-player';
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
  const [activeEngagement, setActiveEngagement] = useState(null);
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

  const engagements = [
    { icon: Shield, text: "Maîtrise totale des procédures et usages des greffes", color: "from-blue-400 to-blue-600" },
    { icon: CheckCircle, text: "Formalité validée", color: "from-green-400 to-green-600" },
    { icon: Clock, text: "Formalité urgente", color: "from-orange-400 to-orange-600" },
    { icon: Lock, text: "Formalité sécurisée", color: "from-purple-400 to-purple-600" },
    { icon: Clock, text: "Traitement en urgence des dossiers prioritaires", color: "from-red-400 to-red-600" },
    { icon: Shield, text: "Responsabilité civile professionnelle couvrant l'intégralité de l'intervention", color: "from-indigo-400 to-indigo-600" }
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
              <a 
                href="#contact" 
                className="relative px-8 py-3 font-medium text-white overflow-hidden rounded-full group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transition-transform duration-300 group-hover:scale-110"></span>
                <span className="relative flex items-center">
                  Contactez-nous
                  <ChevronRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </a>
              <button
                onClick={() => navigate(isAuthenticated ? getDashboardPath() : '/login')}
                className="text-sm font-medium text-slate-400 hover:text-white transition-all duration-300 px-4 py-2 rounded-lg hover:bg-white/5"
              >
                {isAuthenticated ? 'Tableau de bord' : 'Commencer'}
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
            <a 
              href="#contact" 
              onClick={() => setIsMenuOpen(false)} 
              className="block w-full text-left font-medium text-slate-300 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300"
            >
              Contactez-nous
            </a>
            <button
              onClick={() => { setIsMenuOpen(false); navigate(isAuthenticated ? getDashboardPath() : '/login'); }}
              className="block w-full text-left font-medium text-slate-400 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-all duration-300 border-t border-slate-800 pt-4"
            >
              {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
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
              <div className="w-full max-w-3xl rounded-3xl border border-slate-700/70 bg-slate-950/40 shadow-2xl p-1">
              <iframe width="894" height="503" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {engagements.map((item, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer"
                onMouseEnter={() => setActiveEngagement(index)}
                onMouseLeave={() => setActiveEngagement(null)}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {item.text}
                  </p>
                  
                  {/* Animated corner decoration */}
                  <div className={`absolute -top-2 -right-2 w-8 h-8 ${activeEngagement === index ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                    <div className={`w-full h-full bg-gradient-to-br ${item.color} rounded-full animate-ping`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
            <span className="text-xs font-medium text-green-400">Démarrez maintenant</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            <span className="text-white">Prêt à lancer votre</span>{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              formalité ?
            </span>
          </h2>
          
          <a 
            href="#contact" 
            className="group relative inline-flex items-center px-12 py-5 font-semibold text-lg text-white overflow-hidden rounded-full"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-gradient bg-300 transition-all duration-300 group-hover:scale-110"></span>
            <span className="relative flex items-center">
              Contactez-nous
              <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={24} />
            </span>
          </a>
        </div>
      </section>

      {/* Contact / Footer Top */}
      <section id="contact" className="px-6 py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-12 border border-slate-700/50 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <p className="font-bold text-2xl mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Simplifiez vos formalités juridiques avec Greffissimo.
              </p>
              <p className="font-semibold text-lg text-slate-300 mb-6">Contact</p>
              <a 
                href="mailto:contact@greffissimo.fr" 
                className="inline-flex items-center text-lg text-blue-400 hover:text-blue-300 transition-colors duration-300 group"
              >
                <span className="underline decoration-blue-400/30 hover:decoration-blue-400/60 transition-all duration-300">
                  contact@greffissimo.fr
                </span>
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
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
