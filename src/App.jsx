import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Shield, Clock, CheckCircle, Lock } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cookiesVisible, setCookiesVisible] = useState(true);
  
  // Simulated auth state - replace with your actual auth implementation
  const isAuthenticated = false;
  const user = null;

  const navigate = (path) => {
    window.location.href = path;
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                G
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Greffissimo
              </span>
            </button>

            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-10">
              <button onClick={() => navigate('/')} className="text-slate-700 hover:text-slate-900 font-medium transition-colors duration-300 relative group">
                Accueil
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button onClick={() => navigate('/faq')} className="text-slate-700 hover:text-slate-900 font-medium transition-colors duration-300 relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-slate-900 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <a href="#contact" className="px-6 py-3 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium hover:shadow-xl transition-all duration-300 hover:scale-105">
                Contactez-nous
              </a>
              <button
                onClick={() => navigate(isAuthenticated ? getDashboardPath() : '/auth')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-300"
              >
                {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
              </button>
            </div>

            {/* Mobile */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg transition-all duration-500 ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-6 py-6 space-y-4">
            <button onClick={() => { setIsMenuOpen(false); navigate('/'); }} className="block w-full text-left font-medium text-slate-700 hover:text-slate-900 py-2">
              Accueil
            </button>
            <button onClick={() => { setIsMenuOpen(false); navigate('/faq'); }} className="block w-full text-left font-medium text-slate-700 hover:text-slate-900 py-2">
              FAQ
            </button>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="block w-full text-left font-medium text-slate-700 hover:text-slate-900 py-2">
              Contactez-nous
            </a>
            <button
              onClick={() => { setIsMenuOpen(false); navigate(isAuthenticated ? getDashboardPath() : '/auth'); }}
              className="block w-full text-left font-medium text-slate-600 hover:text-slate-900 py-2 border-t border-slate-100 pt-4"
            >
              {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-0 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-300/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 bg-clip-text text-transparent">
              Formalités pour professionnels du droit et du chiffre
            </h1>

            <div className="mt-10">
              <a href="#contact" className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                Contactez-nous
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Pourquoi Greffissimo ? */}
      <section className="px-6 py-20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Pourquoi Greffissimo ?
            </h2>
            <div className="space-y-6 text-lg text-slate-700 leading-relaxed">
              <p>
                Chez Greffissimo, nous connaissons parfaitement les contraintes des professionnels du droit et du chiffre : délais serrés,
                exigences strictes et dossiers sans marge d'erreur.
              </p>
              <p>
                Notre mission : vous offrir une prise en charge rapide et fiable de vos formalités, tout en vous libérant du temps
                pour vous concentrer sur votre véritable cœur de métier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nos engagements */}
      <section className="px-6 py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold mb-12 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Nos engagements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, text: "Maîtrise totale des procédures et usages des greffes" },
              { icon: CheckCircle, text: "Formalité validée" },
              { icon: Clock, text: "Formalité urgente" },
              { icon: Lock, text: "Formalité sécurisée" },
              { icon: Clock, text: "Traitement en urgence des dossiers prioritaires" },
              { icon: Shield, text: "Responsabilité civile professionnelle couvrant l'intégralité de l'intervention" }
            ].map((item, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-slate-800 group-hover:to-slate-900 transition-all duration-300">
                    <item.icon className="w-6 h-6 text-slate-700 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <p className="text-slate-700 font-medium flex-1">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Prêt à lancer votre formalité ?
          </h2>
          <a href="#contact" className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            Contactez-nous
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </a>
        </div>
      </section>

      {/* Contact / Footer Top */}
      <section id="contact" className="px-6 py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100">
            <p className="font-bold text-xl mb-2 text-slate-800">Simplifiez vos formalités juridiques avec Greffissimo.</p>
            <p className="font-bold text-lg text-slate-700 mb-4">Contact</p>
            <a href="mailto:contact@greffissimo.fr" className="text-lg text-slate-600 hover:text-slate-900 underline decoration-slate-300 hover:decoration-slate-900 transition-colors duration-300">
              contact@greffissimo.fr
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h4 className="text-xl font-bold mb-6 text-slate-800">Plan du site :</h4>
          <ul className="space-y-3">
            {[
              { text: "Accueil", action: () => navigate('/') },
              { text: "FAQ", action: () => navigate('/faq') }
            ].map((item, index) => (
              <li key={index}>
                <button onClick={item.action} className="text-slate-600 hover:text-slate-900 underline decoration-slate-300 hover:decoration-slate-900 transition-colors duration-300">
                  {item.text}
                </button>
              </li>
            ))}
            <li>
              <a href="/mentions-legales" className="text-slate-600 hover:text-slate-900 underline decoration-slate-300 hover:decoration-slate-900 transition-colors duration-300">
                Mentions légales
              </a>
            </li>
          </ul>
        </div>
      </footer>

      {/* Cookie banner */}
      {cookiesVisible && (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-4">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white shadow-2xl border border-slate-200">
              <p className="mb-4 text-slate-700">
                Ce site utilise des cookies pour assurer son bon fonctionnement et améliorer votre expérience.
                En utilisant ce site, vous acceptez notre utilisation des cookies.
              </p>
              <div className="flex gap-3">
                <button
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium hover:shadow-lg transition-all duration-300"
                  onClick={() => setCookiesVisible(false)}
                >
                  Accept
                </button>
                <button
                  className="px-6 py-2.5 rounded-full border-2 border-slate-300 text-slate-700 font-medium hover:border-slate-900 hover:text-slate-900 transition-all duration-300"
                  onClick={() => setCookiesVisible(false)}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;