import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Camera, MessagesSquare, ArrowRight, Smartphone } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      navigate('/app', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col overflow-x-hidden">
      <header className="py-6 px-4 md:px-8 max-w-7xl mx-auto w-full flex justify-between items-center z-10 relative">
        <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight flex items-center gap-2">
          <Sparkles className="text-indigo-600" />
          Rommelmarkt.app
        </h1>
        <button 
          onClick={() => navigate('/app')}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-full font-bold hover:bg-gray-800 transition shadow-md"
        >
          Open App
        </button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-16 md:pt-24 pb-20 max-w-5xl mx-auto relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none"></div>

        <span className="bg-indigo-100 text-indigo-700 font-extrabold px-4 py-1.5 rounded-full text-sm mb-8 inline-block shadow-sm">
          ✨ De Eerste AI-Gedreven Lokale Marktplaats
        </span>
        
        <h2 className="text-6xl md:text-8xl font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.1]">
          Verkoop je spullen <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">razendsnel met AI.</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-3xl mx-auto font-medium">
          Maak in één keer foto's van ál je spullen. Onze AI analyseert, groepeert en maakt direct perfecte advertenties. Zelfs onderhandelen gaat vanzelf.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => navigate('/app')}
            className="group bg-indigo-600 text-white px-8 py-4 rounded-full font-extrabold text-lg hover:bg-indigo-700 transition shadow-xl hover:shadow-indigo-200 hover:-translate-y-1 flex items-center gap-2"
          >
            Start met Verkopen
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="text-gray-500 hover:text-gray-900 font-bold px-8 py-4 transition"
          >
            Ontdek hoe het werkt
          </a>
        </div>

        <div id="features" className="mt-32 w-full">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl text-left border border-gray-100 shadow-xl shadow-gray-100/50 hover:-translate-y-1 transition duration-300">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Camera size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">1. Batch Scanning</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Maak achter elkaar foto's van alles wat je wilt verkopen. De AI groepeert ze en verzint per item een perfecte titel en prijs.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl text-left border border-gray-100 shadow-xl shadow-gray-100/50 hover:-translate-y-1 transition duration-300">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">2. Bepaal je Bodem</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Geef een onzichtbare bodemprijs op. Zo weet de AI-agent tot hoe ver hij mag zakken tijdens een onderhandeling.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl text-left border border-gray-100 shadow-xl shadow-gray-100/50 hover:-translate-y-1 transition duration-300">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <MessagesSquare size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">3. AI Onderhandelt</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Kopers chatten direct met jouw bot. Pas bij een deal krijg je een seintje om de betaling of overdracht te regelen.</p>
            </div>
          </div>
        </div>

        <div className="mt-32 bg-gray-900 text-white rounded-3xl p-12 w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 text-left md:w-2/3">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Klaar voor de PWA Builder</h2>
            <p className="text-xl text-gray-400 font-medium mb-8 leading-relaxed">
              Installeer deze app direct op je homescreen. We bouwen het klaar voor de app stores. Alles wat je nodig hebt om lokaal spullen te verkopen, veilig en supersnel.
            </p>
            <button 
              onClick={() => navigate('/app')}
              className="bg-white text-gray-900 px-8 py-4 rounded-full font-extrabold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Open App
            </button>
          </div>
        </div>
      </main>
      
      <footer className="py-10 text-center text-gray-400 font-medium border-t border-gray-100 bg-gray-50 mt-auto">
        <p>&copy; {new Date().getFullYear()} Rommelmarkt.app. All rights reserved.</p>
        <p className="text-sm mt-2">Privacy & Voorwaarden</p>
      </footer>
    </div>
  );
}
