import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, Copy, Globe, ShieldCheck, Trash2, Edit2, X, Heart, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, getMessagingInstance, getToken, handleFirestoreError, OperationType } from '../lib/firebase';

export default function Profile() {
  const { user, signInWithGoogle, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('EUR');
  const [myListings, setMyListings] = useState<any[]>([]);
  
  const [editingListing, setEditingListing] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editBottomPrice, setEditBottomPrice] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editZipCode, setEditZipCode] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDeliveryPref, setEditDeliveryPref] = useState('both');
  const [userData, setUserData] = useState<any>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) {
      alert('Log in om notificaties in te schakelen.');
      return;
    }
    const messaging = await getMessagingInstance();
    if (!messaging) {
      alert('Push notificaties worden niet ondersteund in deze browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        let token;
        try {
          token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        } catch (e) {
          console.warn("Could not get FCM token, continuing without it.", e);
        }
        
        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { fcmToken: token }, { merge: true });
        }
        
        setNotificationsEnabled(true);
        alert('Notificaties zijn ingeschakeld!');
      } else {
        alert('Toestemming voor notificaties werd geweigerd.');
      }
    } catch (error) {
      console.error('Fout bij instellen notificaties', error);
      alert('Er ging iets mis bij het instellen van notificaties.');
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'nl' : 'en');
    setCurrency(i18n.language === 'en' ? 'USD' : 'EUR');
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Weet je zeker dat je deze advertentie wilt verwijderen?')) return;
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      setMyListings(prev => prev.filter(l => l.id !== listingId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `listings/${listingId}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;
    try {
      const p = parseFloat(editPrice);
      const bp = parseFloat(editBottomPrice);
      if (isNaN(p) || isNaN(bp) || p < 0 || bp < 0 || bp > p) {
        alert('Ongeldige prijzen. Bodemprijs mag niet hoger zijn dan vraagprijs.');
        return;
      }
      const ref = doc(db, 'listings', editingListing.id);
      await updateDoc(ref, {
        price: p,
        bottomPrice: bp
      });
      setMyListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, price: p, bottomPrice: bp } : l));
      setEditingListing(null);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `listings/${editingListing.id}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: editName });
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, {
        displayName: editName,
        phone: editPhone,
        city: editCity,
        zipCode: editZipCode,
        bio: editBio,
        deliveryPreference: editDeliveryPref
      }, { merge: true });
      setUserData((prev: any) => ({
        ...prev,
        phone: editPhone,
        city: editCity,
        zipCode: editZipCode,
        bio: editBio,
        deliveryPreference: editDeliveryPref
      }));
      setShowSettings(false);
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const openSettings = () => {
    setEditName(user?.displayName || '');
    setShowSettings(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setEditBio(data.bio || '');
          setEditCity(data.city || '');
          setEditZipCode(data.zipCode || '');
          setEditPhone(data.phone || '');
          setEditDeliveryPref(data.deliveryPreference || 'both');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    
    const fetchMyListings = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'listings'),
          where('userId', '==', user.uid),
          limit(10)
        );
        const snapshot = await getDocs(q);
        setMyListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      }
    };
    fetchUserData();
    fetchMyListings();
  }, [user]);

  if (!user) {
    return (
      <div className="p-4 h-full bg-gray-50 flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t('profile.title')}</h1>
        <p className="text-gray-500 mb-8 font-medium">{t('profile.loginDesc')}</p>
        <button 
          onClick={signInWithGoogle}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95"
        >
          {t('profile.loginBtn')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full pb-20 relative">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{t('profile.title')}</h1>
        <button onClick={openSettings} className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition">
          <Settings size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex items-center gap-5 relative">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-indigo-100 shadow-sm" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl border-2 border-indigo-200">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-xl text-gray-900 truncate">{user.displayName || 'Gebruiker'}</h2>
          <p className="text-gray-500 text-sm truncate font-medium">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => navigate('/app/profiel/favorieten')} className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:bg-gray-50 transition border-t-4 border-t-red-500">
          <Heart size={24} className="text-red-500 mb-2" />
          <span className="font-bold text-gray-900 text-sm">{t('profile.favorites')}</span>
          <span className="text-xs text-gray-400 mt-1">{t('profile.favoritesDesc')}</span>
        </button>
        <button onClick={handleEnableNotifications} className={`flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:bg-gray-50 transition border-t-4 ${notificationsEnabled ? 'border-t-green-500' : 'border-t-yellow-500'}`}>
          <Bell size={24} className={`${notificationsEnabled ? 'text-green-500' : 'text-yellow-500'} mb-2`} />
          <span className="font-bold text-gray-900 text-sm">{t('profile.notifications')}</span>
          <span className="text-xs text-gray-400 mt-1">{notificationsEnabled ? t('profile.notificationsEnabled') : t('profile.notificationsEnable')}</span>
        </button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button onClick={toggleLanguage} className="flex-1 flex gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:bg-gray-50 transition border-l-4 border-l-indigo-500">
          <Globe size={24} className="text-indigo-600" />
          <div className="text-left">
            <span className="font-bold text-gray-900 text-sm block">{i18n.language === 'en' ? 'English (USD)' : 'Nederlands (EUR)'}</span>
            <span className="text-xs text-gray-400">{t('profile.language')}</span>
          </div>
        </button>
        <button onClick={() => navigate('/app/legal')} className="flex-1 flex gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:bg-gray-50 transition border-l-4 border-l-indigo-500">
          <ShieldCheck size={24} className="text-green-600" />
          <div className="text-left">
            <span className="font-bold text-gray-900 text-sm block">{t('profile.legal')}</span>
            <span className="text-xs text-gray-400">{t('profile.legalDesc')}</span>
          </div>
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3 ml-1">{t('profile.myListings')}</h3>
        {myListings.length === 0 ? (
          <div className="text-center text-gray-400 font-medium py-10 bg-white rounded-2xl border border-gray-100 border-dashed shadow-sm">
            {t('profile.noListings')}
          </div>
        ) : (
          <div className="space-y-3">
            {myListings.map(listing => (
              <div key={listing.id} onClick={() => navigate(`/app/listing/${listing.id}`)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition">
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{listing.title}</h4>
                  <p className="text-indigo-600 font-extrabold text-sm opacity-80">€ {listing.price}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {listing.status === 'active' && (
                    <span className="bg-green-100 text-green-700 text-[10px] uppercase font-black px-2 py-1 rounded-md">Live</span>
                  )}
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingListing(listing);
                        setEditPrice(String(listing.price));
                        setEditBottomPrice(String(listing.bottomPrice));
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteListing(listing.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {editingListing && (
        <div className="fixed md:absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-gray-900">{t('profile.adjustPrice')}</h3>
              <button onClick={() => setEditingListing(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Vraagprijs (€)</label>
                <input 
                  type="number" 
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-1">Bodemprijs (€) <span className="text-xs font-normal text-gray-400">(Niet zichtbaar)</span></label>
                <input 
                  type="number" 
                  value={editBottomPrice}
                  onChange={(e) => setEditBottomPrice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            
            <button 
              onClick={handleSaveEdit}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-indigo-700 transition"
            >
              {t('profile.save')}
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed md:absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 transform w-full md:max-w-2xl mx-auto relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">{t('profile.settings')}</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6 mb-8 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.displayName')}</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Naam"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.phone')}</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder={t('profile.phonePlaceholder')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.city')}</label>
                  <input 
                    type="text" 
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Amsterdam"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.zipCode')}</label>
                  <input 
                    type="text" 
                    value={editZipCode}
                    onChange={(e) => setEditZipCode(e.target.value)}
                    placeholder="1011AB"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.deliveryPref')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setEditDeliveryPref('pickup')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${editDeliveryPref === 'pickup' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {t('profile.pickup')}
                  </button>
                  <button
                    onClick={() => setEditDeliveryPref('shipping')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${editDeliveryPref === 'shipping' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {t('profile.shipping')}
                  </button>
                  <button
                    onClick={() => setEditDeliveryPref('both')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${editDeliveryPref === 'both' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {t('profile.both')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.bio')}</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={t('profile.bioPlaceholder')}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('profile.email')}</label>
                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-500 cursor-not-allowed">
                  {user.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('profile.emailDesc')}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">{t('profile.account')}</h3>
                <button 
                  onClick={() => {
                    logout();
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition mb-2"
                >
                  <span className="font-bold text-gray-700">{t('profile.logout')}</span>
                  <LogOut size={18} className="text-gray-500" />
                </button>
                <button 
                  className="w-full flex items-center gap-2 justify-center p-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition"
                >
                  <Trash2 size={18} />
                  {t('profile.deleteAccount')}
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleSaveProfile}
              className="w-full bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-indigo-700 transition"
            >
              {t('profile.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
