import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, query, where, getDocs, addDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Share, Heart, MapPin, ShieldCheck, Flag } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'listings', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setListing({ id: snapshot.id, ...snapshot.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `listings/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    const likeId = `${user.uid}_${id}`;
    const unsubscribe = onSnapshot(doc(db, 'likes', likeId), (docSnapshot) => {
      setIsLiked(docSnapshot.exists());
    }, (error) => {
      console.log('Error fetching like status:', error);
    });

    return () => unsubscribe();
  }, [user, id]);

  const toggleLike = async () => {
    if (!user || !id) {
      alert("Je moet ingelogd zijn om favorieten op te slaan.");
      return;
    }
    
    const wasLiked = isLiked;
    setIsLiked(!wasLiked); // Optimistic

    try {
      const likeId = `${user.uid}_${id}`;
      if (wasLiked) {
        await deleteDoc(doc(db, 'likes', likeId));
      } else {
        await setDoc(doc(db, 'likes', likeId), {
          userId: user.uid,
          listingId: id,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      setIsLiked(wasLiked); // Revert
      handleFirestoreError(error, wasLiked ? OperationType.DELETE : OperationType.CREATE, `likes/${user.uid}_${id}`);
    }
  };

  const initiateChat = async () => {
    if (!user) {
      navigate('/app/profiel');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Import serverTimestamp here or adjust
      const { serverTimestamp } = await import('firebase/firestore');
      
      const roomsRef = collection(db, 'rooms');
      const q = query(
        roomsRef, 
        where('listingId', '==', listing.id),
        where('buyerId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        navigate(`/app/berichten/${snapshot.docs[0].id}`);
        return;
      }
      
      const newRoom = {
        listingId: listing.id,
        buyerId: user.uid,
        sellerId: listing.userId,
        status: 'open',
        agreedPrice: 0,
        createdAt: serverTimestamp()
      };
      
      const res = await addDoc(roomsRef, newRoom);
      navigate(`/app/berichten/${res.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rooms');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('listing.shareText', { title: listing.title }),
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert(t('listing.copied'));
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-4 flex flex-col justify-center items-center h-full bg-gray-50 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Advertentie niet gevonden</h2>
        <button onClick={() => navigate(-1)} className="text-indigo-600 font-bold bg-white px-4 py-2 rounded-lg shadow-sm">Terug</button>
      </div>
    );
  }

  const isOwner = user?.uid === listing.userId;

  return (
    <div className="bg-gray-50 min-h-full pb-24 relative">
      {/* Header with image */}
      <div className="relative w-full md:h-[500px] h-72 bg-gray-200 overflow-x-auto snap-x snap-mandatory flex mx-auto max-w-5xl">
        {listing.images && listing.images.length > 0 ? (
          listing.images.map((img: string, idx: number) => (
            <div key={idx} className="w-full flex-shrink-0 snap-center">
              <img src={img} alt={`${listing.title} - ${idx}`} className="w-full h-full object-cover" />
            </div>
          ))
        ) : listing.imageUrl ? (
          <div className="w-full flex-shrink-0 snap-center">
            <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">Geen afbeelding</div>
        )}
        
        {/* Top actions */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent sticky left-0 z-10 w-[100vw]">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition">
              <Share size={20} />
            </button>
            <button 
              onClick={toggleLike} 
              className={`p-2 backdrop-blur-md rounded-full transition ${isLiked ? 'bg-red-500/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-extrabold text-gray-900">{listing.title}</h1>
          <p className="text-2xl font-extrabold text-indigo-600">{formatCurrency(listing.price)}</p>
        </div>
        
        <div className="flex gap-3 mb-6">
          <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
            <span className="mt-0.5">{listing.category || 'Advertentie'}</span>
          </span>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            AI Negotiator
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-2">Beschrijving</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>
        
        <div 
          onClick={() => navigate(`/app/verkoper/${listing.userId}`)}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-xl">
             V
          </div>
          <div className="flex-1">
             <h4 className="font-bold text-gray-900 flex items-center gap-1">Verkoper bekijken <ShieldCheck size={14} className="text-green-500" /></h4>
             <p className="text-xs text-gray-500">Klik voor meer advertenties</p>
          </div>
        </div>

        {listing.location && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" /> {t('listing.locationTitle')}
            </h4>
            <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden relative">
               <img 
                 src={`https://maps.googleapis.com/maps/api/staticmap?center=${listing.location.lat},${listing.location.lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${listing.location.lat},${listing.location.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ''}`}
                 alt="Kaart"
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // Fallback when map fails (e.g. no API key)
                   (e.target as HTMLImageElement).style.display = 'none';
                   const parent = (e.target as HTMLImageElement).parentElement;
                   if (parent && !parent.querySelector('.fallback-map-text')) {
                     const fallbackText = document.createElement('div');
                     fallbackText.className = 'absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center text-sm fallback-map-text';
                     fallbackText.innerHTML = `<div>${t('listing.loadingCoords')}</div><div class="font-bold mt-1">${listing.location.lat.toFixed(4)}, ${listing.location.lng.toFixed(4)}</div>`;
                     parent.appendChild(fallbackText);
                   }
                 }}
               />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center text-balance">{t('listing.locationDesc')}</p>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-100 transition shadow-sm w-full justify-center"
          >
            <Share size={18} />
            {t('listing.shareBtn')}
          </button>
        </div>

        <div className="flex justify-center mb-10">
          <button 
            onClick={() => {
              if (!user) {
                alert("Je moet ingelogd zijn om een advertentie te rapporteren.");
                return;
              }
              alert("Bedankt voor je rapportage. We nemen dit in behandeling.");
            }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition"
          >
            <Flag size={14} /> Rapporteer deze advertentie
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 z-50 pb-safe">
        <div className="flex gap-3 p-4 max-w-3xl mx-auto">
          {isOwner ? (
            <button className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg cursor-not-allowed opacity-50">
              Dit is jouw advertentie
            </button>
          ) : (
            <>
              <button 
                onClick={initiateChat}
                disabled={isProcessing}
                className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 py-3 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:bg-indigo-50 transition disabled:opacity-50"
              >
                Doe een bod
              </button>
              <button 
                onClick={initiateChat}
                disabled={isProcessing}
                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Nu Kopen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
