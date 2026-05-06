import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, Trash2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '../lib/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function ScanUpload() {
  const webcamRef = useRef<Webcam>(null);
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [products, setProducts] = useState<any[] | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const playShutterSound = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    try {
      const ctx = new AudioContextClass();
      
      // Click sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      // Noise part
      const bufferSize = ctx.sampleRate * 0.1; // 100ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      
      const noiseEnvelope = ctx.createGain();
      noiseEnvelope.gain.setValueAtTime(0.5, ctx.currentTime);
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(ctx.destination);
      
      noiseSource.start(ctx.currentTime);
    } catch (e) {
      console.warn("AudioContext failed to play", e);
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        playShutterSound();
        setImages(prev => [...prev, imageSrc]);
      }
    }
  }, [webcamRef]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing AI API key");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyseer deze foto's om productadvertenties te maken voor een tweedehands marktplaats in het Nederlands. Je krijgt meerdere foto's. Bepaal welke foto's bij hetzelfde stuks/product horen. Groepeer ze en geef een array van producten terug. Voor elk product: een korte SEO-vriendelijke titel, een strakke 3-regelige beschrijving, schat de huidige realistische vraagprijs (price) en de absolute bodemprijs (bottomPrice) in EUR. Kies een categorie (Elektronica, Meubels, Kleding, Sport, Boeken, of Overig). Geef bovenaan de lijst met indices van de foto's die bij dit product horen." },
              ...images.map((img, index) => ({
                inlineData: {
                  mimeType: "image/jpeg",
                  data: img.split(',')[1]
                }
              }))
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                bottomPrice: { type: Type.NUMBER },
                category: { type: Type.STRING },
                photoIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
              },
              required: ["title", "description", "price", "bottomPrice", "category", "photoIndices"]
            }
          }
        }
      });
      
      if (response.text) {
        const parsed = JSON.parse(response.text);
        setProducts(parsed);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert("Er is een fout opgetreden bij het analyseren van de foto's. " + (error instanceof Error ? error.message : "Controleer of de AI goed is ingesteld."));
    } finally {
      setAnalyzing(false);
    }
  };

  const updateProduct = (index: number, field: string, value: any) => {
    if (!products) return;
    const newProds = [...products];
    newProds[index][field] = value;
    setProducts(newProds);
  };

  const reset = () => {
    setImages([]);
    setProducts(null);
  };

  const { user } = useAuth();

  const setLive = async () => {
    if (!products || !user || images.length === 0) {
      navigate('/app/profiel');
      return;
    }
    
    setAnalyzing(true);
    try {
      let location = { lat: 52.3676, lng: 4.9041 }; // Default to Amsterdam if geolocation fails
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        location = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch (err) {
        console.warn('Geolocation failed, saving without accurate location:', err);
      }

      const listingsRef = collection(db, 'listings');
      for (const p of products) {
        const slug = (p.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 199);
        
        // Upload images to Firebase Storage
        const itemImageUrls: string[] = [];
        const photoIndices = p.photoIndices || [0];
        
        for (const idx of photoIndices) {
          if (images[idx]) {
            const base64Str = images[idx];
            const storageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${idx}.jpg`);
            try {
              await uploadString(storageRef, base64Str, 'data_url');
              const downloadUrl = await getDownloadURL(storageRef);
              itemImageUrls.push(downloadUrl);
            } catch (storageErr: any) {
              console.error("Storage upload error:", storageErr);
              // Rethrow with more context if it's a permission error
              if (storageErr.code === 'storage/unauthorized') {
                throw new Error(`Firebase Storage: User does not have permission to access '${storageRef.fullPath}'. (storage/unauthorized)`);
              }
              throw storageErr;
            }
          }
        }
        
        const mainImage = itemImageUrls.length > 0 ? itemImageUrls[0] : '';
        
        const newListing = {
          userId: user.uid,
          title: String(p.title || 'Product').slice(0, 999),
          description: String(p.description || '').slice(0, 9999),
          price: Number(p.price) || 0,
          bottomPrice: Number(p.bottomPrice) || 0,
          category: String(p.category || 'Overig').slice(0, 99),
          marketValue: Number(p.price) || 0,
          imageUrl: mainImage,
          images: itemImageUrls.length > 0 ? itemImageUrls.slice(0, 10) : [mainImage],
          status: 'active',
          createdAt: serverTimestamp(),
          slug: slug,
          currency: 'EUR',
          language: 'nl',
          location: location
        };

        await addDoc(listingsRef, newListing);
      }
      
      navigate('/app/profiel');
    } catch (error: any) {
      console.error("Opslaan mislukt:", error);
      alert("Er ging iets mis bij het opslaan: " + (error.message || "Onbekende fout"));
      
      const isStorage = error?.message?.includes('Firebase Storage');
      try {
        handleFirestoreError(
          error, 
          isStorage ? OperationType.WRITE : OperationType.CREATE, 
          isStorage ? `storage/${user?.uid}` : 'listings'
        );
      } catch (e) {
        // Already logged by handleFirestoreError, we swallow it here so we don't crash the click handler
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full bg-black flex flex-col relative">
      {!products && !analyzing && (
        <div className="flex-1 relative">
          {/* @ts-ignore - mismatch in react-webcam props */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.8}
            className="w-full h-full object-cover"
            videoConstraints={{ width: 640, height: 480, facingMode: 'environment' }}
            onUserMediaError={(err) => console.error("Webcam error:", err)}
          />
          
          {/* Thumbnails of taken photos */}
          <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-white">
                <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="absolute bottom-24 flex justify-between items-center w-full px-8">
            <div className="w-16"></div> {/* Spacer */}
            
            <button 
              onClick={capture}
              className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center z-10 active:scale-95 transition"
            >
              <div className="w-16 h-16 bg-white rounded-full shadow-inner border border-gray-100"></div>
            </button>
            
            <div className="w-16 flex justify-end">
              {images.length > 0 && (
                <button 
                  onClick={analyzeImages}
                  className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition"
                  title="Verwerk foto's"
                >
                  <ArrowRight size={24} />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {images.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="flex-1 flex flex-col items-center justify-center bg-white text-indigo-900 pb-20">
          <RefreshCw size={40} className="animate-spin mb-4 text-indigo-600" />
          <p className="font-bold text-lg">{images.length > 1 ? `Analyseren en groeperen van ${images.length} foto's...` : t('scan.analyzing')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('scan.analyzingText')}</p>
        </div>
      )}

      {products && !analyzing && (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto pb-24">
          <div className="p-4 flex flex-col gap-6 max-w-3xl mx-auto w-full">
            <h2 className="text-xl font-extrabold text-gray-900">Gevonden Advertenties ({products.length})</h2>
            
            {products.map((prod, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex overflow-x-auto bg-gray-100 p-2 gap-2">
                  {(prod.photoIndices || []).map((photoIdx: number) => (
                    images[photoIdx] && (
                      <img key={photoIdx} src={images[photoIdx]} alt="item" className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                    )
                  ))}
                  {(!prod.photoIndices || prod.photoIndices.length === 0) && (
                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-400">Geen foto</div>
                  )}
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-extrabold tracking-wider">{t('scan.title')}</label>
                    <input 
                      type="text" 
                      value={prod.title} 
                      onChange={(e) => updateProduct(idx, 'title', e.target.value)}
                      className="w-full border-b border-gray-200 py-1 focus:outline-none focus:border-indigo-600 font-bold text-gray-900" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-extrabold tracking-wider">{t('scan.description')}</label>
                    <textarea 
                      value={prod.description} 
                      onChange={(e) => updateProduct(idx, 'description', e.target.value)}
                      rows={2} 
                      className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-600 text-sm text-gray-700"
                    ></textarea>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-indigo-600 font-extrabold tracking-wider">{t('scan.askingPrice')}</label>
                      <input 
                        type="number" 
                        value={prod.price} 
                        onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                        className="w-full border-b border-indigo-200 py-1 focus:outline-none focus:border-indigo-600 font-bold text-lg text-indigo-900" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-red-500 font-extrabold tracking-wider">{t('scan.bottomPrice')}</label>
                      <input 
                        type="number" 
                        value={prod.bottomPrice} 
                        onChange={(e) => updateProduct(idx, 'bottomPrice', e.target.value)}
                        className="w-full border-b border-red-200 py-1 focus:outline-none focus:border-red-500 font-bold text-lg text-red-600" 
                      />
                    </div>
                  </div>
                  <button onClick={() => setProducts(products.filter((_, i) => i !== idx))} className="text-xs text-red-500 font-bold w-full text-center py-2 hover:bg-red-50 rounded-lg transition">Verwijder Advertentie</button>
                </div>
              </div>
            ))}

            <div className="flex gap-3 mt-4">
              <button onClick={reset} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                Opnieuw
              </button>
              <button 
                onClick={setLive} 
                disabled={products.length === 0}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <Check size={20} strokeWidth={3} />
                Plaats {products.length} Advertenties
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
