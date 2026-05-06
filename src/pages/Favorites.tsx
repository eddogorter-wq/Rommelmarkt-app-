import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, Share } from 'lucide-react';

export default function Favorites() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      try {
        const likesRef = collection(db, 'likes');
        const q = query(likesRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const likedIds = snapshot.docs.map(d => d.data().listingId);
        
        if (likedIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Fetch actual listings
        const listings: any[] = [];
        for (const id of likedIds) {
          try {
            const listDoc = await getDoc(doc(db, 'listings', id));
            if (listDoc.exists()) {
              listings.push({ id: listDoc.id, ...listDoc.data() });
            }
          } catch (e) {
            console.error("Could not fetch listing", id);
          }
        }
        
        setFavorites(listings);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'likes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleShare = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/app/listing/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('listing.shareText', { title }),
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert(t('listing.copied'));
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-4 h-full bg-gray-50 flex flex-col justify-center items-center text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inloggen vereist</h2>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-900 mr-2 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Mijn Favorieten</h1>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4 p-6">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Geen favorieten</h3>
            <p className="text-gray-500 font-medium">Je hebt nog geen advertenties opgeslagen. Tik op het hartje bij een advertentie om deze te bewaren.</p>
            <button 
              onClick={() => navigate('/app')}
              className="mt-6 bg-indigo-50 border-2 border-indigo-100 text-indigo-600 font-bold py-3 px-6 rounded-xl hover:bg-indigo-100 transition"
            >
              Ontdek advertenties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
            {favorites.map(item => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/app/listing/${item.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition active:scale-[0.98] flex flex-col h-full"
              >
                <div className="relative aspect-[4/5] bg-gray-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">Na photo</div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    <button 
                      onClick={(e) => handleShare(e, item.id, item.title)}
                      className="p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-gray-900 hover:text-indigo-600 transition"
                    >
                      <Share size={16} />
                    </button>
                    <div className="p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm">
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{item.title}</h3>
                  <p className="font-extrabold text-indigo-600 mt-0.5">{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
