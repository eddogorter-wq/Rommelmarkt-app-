import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChevronLeft, ShieldCheck, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerAndListings = async () => {
      if (!id) return;
      
      try {
        // Om privacy redenen hebben we mogelijk geen direct public user profiel in de DB
        // we kunnen wel listings met dit userId ophalen
        const q = query(collection(db, 'listings'), where('userId', '==', id), where('status', '==', 'active'), limit(20));
        const snapshot = await getDocs(q);
        
        const userListings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setListings(userListings);
        
        // Simuleer verkopersdata als we dat niet in DB opslaan of als er geen listings zijn
        setSeller({
          id,
          displayName: userListings.length > 0 && (userListings[0] as any).sellerName ? (userListings[0] as any).sellerName : 'Verkoper',
          joined: '2024'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerAndListings();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full pb-20 relative">
      <div className="bg-white px-4 py-8 border-b border-gray-100 flex flex-col pt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
        
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200 transition z-10">
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center mt-6 z-10">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-4xl mb-4 border-4 border-white shadow-sm">
            {seller?.displayName?.charAt(0) || 'V'}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            {seller?.displayName || 'Verkoper'}
            <ShieldCheck size={20} className="text-green-500" />
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400 fill-yellow-400" /> 4.9 (12 reviews)</span>
            <span>•</span>
            <span>Lid sinds {seller?.joined || '2024'}</span>
          </div>
        </div>
      </div>

      <div className="p-4 mt-2">
        <h3 className="font-extrabold text-gray-900 mb-4 ml-1">Advertenties van deze verkoper ({listings.length})</h3>
        
        {listings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">Deze verkoper heeft momenteel geen actieve advertenties.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {listings.map(item => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/app/listing/${item.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition active:scale-[0.98] flex flex-col h-full"
              >
                <div className="relative aspect-[4/5] bg-gray-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{item.title}</h3>
                  <p className="font-extrabold text-indigo-600 mt-auto">{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
