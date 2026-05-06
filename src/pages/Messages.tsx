import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Messages() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return;
      try {
        const roomsRef = collection(db, 'rooms');
        // Fetch rooms where user is buyer OR seller.
        // Since Firestore can't do OR in a single standard query block easily without composite indexes or `or()`, let's do two queries.
        
        const qBuyer = query(roomsRef, where('buyerId', '==', user.uid));
        const qSeller = query(roomsRef, where('sellerId', '==', user.uid));
        
        const [snapBuyer, snapSeller] = await Promise.all([
          getDocs(qBuyer),
          getDocs(qSeller)
        ]);

        const allRooms = [
          ...snapBuyer.docs.map(d => ({ id: d.id, ...d.data() })),
          ...snapSeller.docs.map(d => ({ id: d.id, ...d.data() }))
        ];

        // Fetch listing titles for these rooms (could be optimized, but ok for MVP)
        const roomsWithDeets = await Promise.all(allRooms.map(async (r) => {
          try {
             // Let's just pass listingId and fetch on tap, or we can fetch listing doc if needed
             const { getDoc, doc } = await import('firebase/firestore');
             const lDoc = await getDoc(doc(db, 'listings', (r as any).listingId));
             if (lDoc.exists()) {
               return { ...r, listing: lDoc.data() };
             }
             return r;
          } catch(e) { return r; }
        }));

        setRooms(roomsWithDeets);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'rooms');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (!user) {
    return (
      <div className="p-4 h-full bg-gray-50 flex flex-col justify-center items-center text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inloggen vereist</h2>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full pb-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">{t('messages.title')}</h1>
      
      {loading ? (
        <div className="flex justify-center mt-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">Je hebt nog geen openstaande chats.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">
          {rooms.map(room => {
            const isBuyer = room.buyerId === user.uid;
            const isClosed = room.status === 'closed';
            
            return (
              <div 
                key={room.id}
                onClick={() => navigate(`/app/berichten/${room.id}`)}
                className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer transition ${isClosed ? 'opacity-75' : 'hover:shadow-md'}`}
              >
                <div>
                  <h3 className={`font-extrabold text-lg mb-1 ${isClosed ? 'text-gray-900 line-through text-opacity-50' : 'text-gray-900'}`}>{room.listing?.title || 'Onbekend Item'}</h3>
                  <div className="flex gap-2 items-center">
                    {!isBuyer && <span className="bg-orange-100 text-orange-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-md">Jouw item</span>}
                    {isClosed ? (
                      <p className="text-sm font-bold text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-md">
                        {t('messages.dealClosed')} ({formatCurrency(room.agreedPrice)})
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md flex items-center gap-1">
                        🤖 AI Onderhandelaar
                      </p>
                    )}
                  </div>
                </div>
                <span className={`${isClosed ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'} text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full`}>
                  {isClosed ? t('messages.closed') : t('messages.active')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
