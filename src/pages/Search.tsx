import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const categories = ['Elektronica', 'Meubels', 'Kleding', 'Sport', 'Boeken', 'Overig'];

  useEffect(() => {
    const doSearch = async () => {
      // Allow searching by just filters even if query is empty
      if (searchQuery.trim().length < 2 && !filterCategory && !minPrice && !maxPrice) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      
      try {
        // Try full-stack search using Typesense/Pinecone API
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            filterCategory,
            minPrice,
            maxPrice
          })
        });
        
        const apiData = await response.json();
        
        if (!apiData.fallback && apiData.results) {
          setResults(apiData.results);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("API Search failed. Falling back to Firebase Client Search. ", err);
      }

      // FALLBACK TO FIREBASE CLIENT SEARCH
      try {
        // Build query
        let q = query(collection(db, 'listings'), where('status', '==', 'active'));
        if (filterCategory) {
          q = query(q, where('category', '==', filterCategory));
        }
        
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        
        let filtered = data;

        // Apply text search on client side
        if (searchQuery.trim().length > 0) {
          const lowerQ = searchQuery.toLowerCase();
          filtered = filtered.filter(item => 
            item.title?.toLowerCase().includes(lowerQ) || 
            item.description?.toLowerCase().includes(lowerQ)
          );
        }

        // Apply price filters
        if (minPrice) {
          filtered = filtered.filter(item => item.price >= Number(minPrice));
        }
        if (maxPrice) {
          filtered = filtered.filter(item => item.price <= Number(maxPrice));
        }

        setResults(filtered);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      } finally {
        setLoading(false);
      }
    };

    const timernd = setTimeout(() => {
      doSearch();
    }, 500);

    return () => clearTimeout(timernd);
  }, [searchQuery, filterCategory, minPrice, maxPrice]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterCategory) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  };

  return (
    <div className="p-4 bg-gray-50 min-h-full pb-20">
      <div className="flex gap-2 mb-6 sticky top-4 z-10">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={t('search.placeholder')} 
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-5 pl-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-4 top-4 text-gray-400" size={20} />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          className="bg-white border border-gray-200 rounded-2xl px-4 flex items-center justify-center shadow-sm relative hover:bg-gray-50 transition"
        >
          <SlidersHorizontal className="text-gray-700" size={20} />
          {getActiveFilterCount() > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed md:absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 transform w-full md:max-w-2xl mx-auto h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto w-full">
              <div className="mb-8">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Categorie</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterCategory('')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${!filterCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Alle Categorieën
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${filterCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Prijs</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Van (€)</label>
                    <input 
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tot (€)</label>
                    <input 
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 pb-8">
              <button 
                onClick={() => { setFilterCategory(''); setMinPrice(''); setMaxPrice(''); }}
                className="py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
              >
                Bekijk {results.length} resultaten
              </button>
            </div>
          </div>
        </div>
      )}

      {!hasSearched ? (
        <div className="text-gray-500 text-center mt-20 flex flex-col items-center">
          <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-3xl mb-4 transform -rotate-6">
            <SearchIcon size={32} className="text-indigo-600" />
          </div>
          <p className="font-extrabold text-gray-900 mb-1 text-lg">Vind je volgende parel</p>
          <p className="text-sm font-medium">Zoek in duizenden advertenties</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center mt-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-4">
          <p className="font-bold text-gray-900">Geen resultaten gevonden</p>
          <p className="text-sm text-gray-500 mt-1">Probeer een andere zoekterm of verander je filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex justify-between items-center mb-2 mx-1 md:col-span-2 lg:col-span-3">
            <h3 className="font-extrabold text-gray-900">Resultaten ({results.length})</h3>
            {getActiveFilterCount() > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{getActiveFilterCount()} filters actief</span>
            )}
          </div>
          {results.map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/app/listing/${item.id}`)}
              className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : null}
                <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  {item.category.substring(0, 3)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-base mb-0.5 truncate">{item.title}</h4>
                <p className="text-indigo-600 font-extrabold text-lg flex items-center gap-2">
                  {formatCurrency(item.price)}
                </p>
                <p className="text-xs text-gray-400 font-medium truncate mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
