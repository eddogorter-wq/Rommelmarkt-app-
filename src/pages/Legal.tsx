import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LegalSettings() {
  const navigate = useNavigate();

  return (
    <div className="p-4 bg-gray-50 min-h-full pb-24">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-white rounded-full shadow-sm hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Legal & Settings</h1>
      </div>
      
      <div className="space-y-4">
        {/* GDPR Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Algemene Verordening Gegevensbescherming (GDPR)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Wij respecteren uw privacy. Rommelmarkt.app verwerkt alleen gegevens die noodzakelijk zijn voor het platform:
            - E-mail voor accountbeheer en verificatie.
            - Gegevens van advertenties en chatgeschiedenis met onze AI om de verkoop te faciliteren.
            - AI-interacties worden verwerkt om deals te kunnen sluiten, hierbij maskeren we PII (Personally Identifiable Information) waar mogelijk.
          </p>
          <a href="#" className="text-indigo-600 text-sm font-bold flex items-center hover:underline">Lees ons privacybeleid &rarr;</a>
        </div>

        {/* AI EU Act Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">EU AI Act Compliance</h2>
          <p className="text-sm text-gray-600 mb-4">
            Onze AI Onderhandelaar functioneert transparant als een geautomatiseerd handelssysteem ("Limited Risk" AI-systeem volgens de EU AI Act).
            <br/><br/>
            - De AI beslist niet autonoom over uw eigendommen buiten de ingestelde bodemprijs (bottomPrice).
            - Tijdens chats met andere gebruikers wordt expliciet aangegeven dat er met een AI gecommuniceerd wordt.
            - Menselijk toezicht en het afbreken van de AI-onderhandeling blijft altijd mogelijk voor de eigenaar.
          </p>
        </div>

        {/* Algemene Voorwaarden */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Algemene Voorwaarden</h2>
          <p className="text-sm text-gray-600 mb-4">
            Door gebruik te maken van dit peer-to-peer (P2P) platform stemt u ermee in dat Rommelmarkt.app GEEN "Escrow" partij is en GEEN financiële middelen beheert tussen kopers en verkopers. Het gebruik van het platform is volledig gratis.
          </p>
          <a href="#" className="text-indigo-600 text-sm font-bold flex items-center hover:underline">Lees de voorwaarden &rarr;</a>
        </div>
      </div>
    </div>
  );
}
