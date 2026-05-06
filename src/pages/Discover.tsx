import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, orderBy, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Search as SearchIcon, SlidersHorizontal } from 'lucide-react';

export default function Discover() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Elektronica', 'Meubels', 'Kleding', 'Sport', 'Boeken'];
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => console.log('Error getting location', error),
        { timeout: 10000 }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 
    return Math.round(d);
  };

  const toggleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("Je moet ingelogd zijn om advertenties als favoriet te markeren.");
      return;
    }
    
    // Optimistic UI updates
    const isLiked = likedMap[id];
    setLikedMap(prev => ({...prev, [id]: !isLiked}));

    try {
      const likeId = `${user.uid}_${id}`;
      if (isLiked) {
        await deleteDoc(doc(db, 'likes', likeId));
      } else {
        await setDoc(doc(db, 'likes', likeId), {
          userId: user.uid,
          listingId: id,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      // Revert if error
      setLikedMap(prev => ({...prev, [id]: isLiked}));
      handleFirestoreError(error, isLiked ? OperationType.DELETE : OperationType.CREATE, `likes/${user.uid}_${id}`);
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        let q;
        if (user) {
          q = query(
            collection(db, 'listings'), 
            where('status', '==', 'active'),
            where('userId', '!=', user.uid)
          );
        } else {
          q = query(
            collection(db, 'listings'), 
            where('status', '==', 'active')
          );
        }
        
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        setListings(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const qLikes = query(collection(db, 'likes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(qLikes, (snapshot) => {
      const newLikedMap: Record<string, boolean> = {};
      snapshot.docs.forEach(d => {
        newLikedMap[d.data().listingId] = true;
      });
      setLikedMap(newLikedMap);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'likes');
    });

    return () => unsubscribe();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const filteredListings = activeCategory === 'All' 
    ? listings 
    : listings.filter(item => item.category === activeCategory);

  return (
    <div className="bg-gray-50 min-h-full pb-20">
      <div className="p-4 bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{t('discover.title')}</h1>
          <button onClick={() => navigate('/app/zoeken')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
            <SearchIcon size={20} className="text-gray-700" />
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
          <button className="p-2 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 hover:bg-gray-100 transition mr-1">
            <SlidersHorizontal size={18} className="text-gray-700" />
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">Nog geen advertenties. Scan er nu een!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredListings.map((listing) => (
              <div 
                key={listing.id} 
                onClick={() => navigate(`/app/listing/${listing.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative cursor-pointer hover:shadow-md transition group"
              >
                <div className="bg-gray-200 h-40 w-full relative">
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      {listing.marketValue > listing.price ? t('discover.hotDeal') : 'Nieuw'}
                    </span>
                  </div>
                  <button onClick={(e) => toggleLike(listing.id, e)} className={`absolute top-2 right-2 p-1.5 rounded-full transition ${likedMap[listing.id] ? 'bg-red-500/90 text-white' : 'bg-white/80 backdrop-blur-md text-gray-500 hover:text-red-500'}`}>
                    <Heart size={16} fill={likedMap[listing.id] ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="p-3">
                  <h2 className="font-bold text-gray-900 truncate text-sm">{listing.title}</h2>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-xs text-gray-500">{listing.category}</p>
                    {userLocation && listing.location && (
                      <p className="text-xs text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {calculateDistance(userLocation.lat, userLocation.lng, listing.location.lat, listing.location.lng)} km
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-extrabold text-indigo-600">{formatCurrency(listing.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
