import React from 'react';
import Layout from '@/components/Layout';
import { FileText, Clock, Shield } from 'lucide-react';

const faqs = [
  {
    q: 'Qu’est-ce que Greffissimo ?',
    a: "Greffissimo est un service dédié aux professionnels du droit et du chiffre pour la gestion rapide et sécurisée de leurs formalités juridiques auprès des greffes via le Guichet Unique de l’INPI et les autres autorités concernées (par exemple l’administration fiscale).",
  },
  {
    q: 'En combien de temps traitez-vous une formalité ?',
    a: "Selon l’urgence, une formalité peut être traitée en 24 à 48 heures. Les formalités prioritaires sont traitées en priorité grâce à notre réseau de formalistes expérimentés. Le délai final dépend ensuite du greffe compétent.",
  },
  {
    q: 'Quels types de formalités prenez-vous en charge ?',
    a: "Nous gérons la constitution de toutes sociétés (SAS, SASU, SARL, EURL, SCI, SNC, etc.), les modifications statutaires (gérance, siège social, capital, etc.), le dépôt des comptes annuels ainsi que les autres actes de la vie des sociétés.",
  },
  {
    q: 'Comment évitez-vous les rejets des greffes ?',
    a: "Nos formalistes connaissent parfaitement les usages et exigences des greffes. Chaque dossier est vérifié avant envoi pour garantir sa conformité et limiter les rejets. Si nécessaire, nous prenons attache avec le greffe.",
  },
  {
    q: 'Êtes-vous assurés en cas de problème ?',
    a: "Oui. Greffissimo dispose d’une assurance responsabilité civile professionnelle couvrant l’intégralité de ses interventions, pour une sécurité totale de nos clients.",
  },
  {
    q: 'Comment s’effectue le suivi de mon dossier ?',
    a: "Le suivi se fait via une interface dédiée, avec des notifications en temps réel à chaque étape de l’évolution de votre dossier, jusqu’à sa validation par le greffe.",
  },
  {
    q: 'À qui s’adresse votre service ?',
    a: "Exclusivement aux professionnels du droit et du chiffre : avocats, experts-comptables, notaires, directions juridiques, etc. Le service ne s’adresse pas aux particuliers.",
  },
  {
    q: 'Puis-je confier plusieurs formalités en même temps ?',
    a: "Oui. Nous traitons les dossiers unitaires comme les volumes importants. Chaque formalité est suivie individuellement avec la même rigueur et vous accédez à l’ensemble de vos dossiers depuis une interface unique.",
  },
  {
    q: 'Puis-je faire régler mon client directement via la plateforme ?',
    a: "Oui. En renseignant l’adresse de votre client, nous lui adressons un lien de paiement ainsi que la facture correspondante. Vous n’avez plus à faire l’intermédiaire ni à avancer les frais.",
  },
  {
    q: 'Puis-je échanger en direct avec la personne en charge de ma formalité ?',
    a: "Oui. Un module de conversation est disponible directement depuis l’interface, pour échanger avec le formaliste en charge de votre dossier.",
  },
];

export default function FaqPage() {
  return (
    <Layout title="FAQ">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Foire aux questions</h1>
        <p className="text-gray-300 mb-8">
          Retrouvez ci-dessous les questions les plus fréquentes à propos des formalités en général et de Greffissimo en particulier.
        </p>

        {/* Nos engagements */}
        <section className="mb-12">
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 shadow-lg border border-white/10">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Nos engagements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-white font-medium">
                  Maîtrise totale des procédures et usages des greffes
                </p>
              </div>
              <div className="flex flex-col items-center text-center bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-white font-medium">
                  Traitement en urgence des dossiers prioritaires
                </p>
              </div>
              <div className="flex flex-col items-center text-center bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm text-white font-medium">
                  Responsabilité civile professionnelle couvrant l’intégralité de l’intervention
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {faqs.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white mb-2">{item.q}</h2>
              <p className="text-gray-200 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
