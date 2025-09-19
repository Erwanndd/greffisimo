import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Clock, Shield, Users, FileText, Bell, TrendingUp, ArrowRight, Menu, X, Zap, Globe, Award, BarChart3, Calendar, MessageSquare, Lock, Sparkles, Building2, Scale } from 'lucide-react';
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { value: '500+', label: 'Entreprises accompagnées', icon: Building2 },
    { value: '24h', label: 'Délai moyen de traitement', icon: Clock },
    { value: '99%', label: 'Taux de satisfaction', icon: Award },
    { value: '15k+', label: 'Formalités traitées', icon: FileText }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Sécurité maximale',
      description: 'Vos données sont cryptées et hébergées en France selon les normes RGPD',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Clock,
      title: 'Suivi en temps réel',
      description: 'Suivez l\'avancement de vos formalités minute par minute',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Équipe d\'experts',
      description: 'Des formalistes certifiés à votre service 7j/7',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: 'Traitement express',
      description: 'Vos formalités traitées en 24h chrono',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: MessageSquare,
      title: 'Chat instantané',
      description: 'Communiquez directement avec votre formaliste dédié',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Scale,
      title: 'Conformité garantie',
      description: 'Respect total des procédures légales et administratives',
      gradient: 'from-teal-500 to-cyan-500'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'CEO, TechStart',
      content: 'Greffissimo a transformé notre approche des formalités juridiques. Un gain de temps considérable!',
      avatar: '👩‍💼'
    },
    {
      name: 'Pierre Martin',
      role: 'Directeur Juridique, InnovCorp',
      content: 'La plateforme est intuitive et l\'équipe très réactive. Je recommande vivement leurs services.',
      avatar: '👨‍💼'
    },
    {
      name: 'Sophie Laurent',
      role: 'Fondatrice, GreenTech Solutions',
      content: 'Un service exceptionnel qui nous a fait économiser des semaines de travail administratif.',
      avatar: '👩‍💻'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '49',
      description: 'Pour les entrepreneurs individuels',
      features: ['1 formalité/mois', 'Suivi en temps réel', 'Support par email', 'Documents sécurisés'],
      gradient: 'from-gray-600 to-gray-800',
      popular: false
    },
    {
      name: 'Business',
      price: '199',
      description: 'Pour les PME en croissance',
      features: ['10 formalités/mois', 'Formaliste dédié', 'Support prioritaire 24/7', 'API intégration', 'Rapports personnalisés'],
      gradient: 'from-blue-600 to-purple-600',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Solutions personnalisées',
      features: ['Formalités illimitées', 'Équipe dédiée', 'Formation sur site', 'Intégration complète', 'SLA garanti'],
      gradient: 'from-purple-600 to-pink-600',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Greffissimo
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Tarifs</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Témoignages</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
              <button
                onClick={() => navigate(isAuthenticated ? getDashboardPath() : '/auth')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 font-medium"
              >
                {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
              </button>
            </div>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Tarifs</a>
              <a href="#testimonials" className="block text-gray-300 hover:text-white transition-colors">Témoignages</a>
              <a href="#contact" className="block text-gray-300 hover:text-white transition-colors">Contact</a>
              <button onClick={() => { setIsMenuOpen(false); navigate(isAuthenticated ? getDashboardPath() : '/auth'); }} className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium">
                {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm text-blue-300 font-medium">Nouveau : Intégration API disponible</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Simplifiez vos
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                formalités juridiques
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Greffissimo révolutionne la gestion de vos formalités d'entreprise. 
              Suivez en temps réel, collaborez efficacement, gagnez du temps.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button onClick={() => navigate('/auth')} className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 font-semibold text-lg flex items-center justify-center">
                Commencer gratuitement
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button onClick={() => navigate('/faq')} className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold text-lg border border-white/20">
                Voir la démo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                    <stat.icon className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Une plateforme complète pour gérer toutes vos formalités juridiques en toute sérénité
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all h-full">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Des tarifs transparents
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choisissez l'offre qui correspond à vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`relative group ${plan.popular ? 'scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full font-medium">
                      Plus populaire
                    </span>
                  </div>
                )}
                <div className={`relative bg-white/5 backdrop-blur-sm border ${plan.popular ? 'border-blue-500/50' : 'border-white/10'} rounded-2xl p-8 hover:border-white/20 transition-all h-full`}>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 'Sur mesure' ? plan.price : `${plan.price}€`}
                    </span>
                    {plan.price !== 'Sur mesure' && <span className="text-gray-400">/mois</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}>
                    {plan.price === 'Sur mesure' ? 'Nous contacter' : 'Choisir ce plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-300">
              Découvrez ce que nos clients disent de nous
            </p>
          </div>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">{testimonials[activeTestimonial].avatar}</div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{testimonials[activeTestimonial].name}</h4>
                  <p className="text-gray-400">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
              <p className="text-xl text-gray-300 italic">"{testimonials[activeTestimonial].content}"</p>
              
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeTestimonial ? 'w-8 bg-blue-500' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-3xl opacity-30"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Prêt à simplifier vos formalités ?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Rejoignez plus de 500 entreprises qui font déjà confiance à Greffissimo pour leurs démarches juridiques.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/auth')} className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg">
                  Essayer gratuitement
                </button>
                <button onClick={() => navigate('/faq')} className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold text-lg border border-white/30">
                  Parler à un expert
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">G</span>
                </div>
                <span className="text-xl font-bold text-white">Greffissimo</span>
              </div>
              <p className="text-gray-400">
                Votre partenaire de confiance pour toutes vos formalités juridiques.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Intégrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">CGU</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">RGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Greffissimo. Tous droits réservés. Made with ❤️ in France
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Protected route wrapper for authenticated sections
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<LoginPage />} />
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
