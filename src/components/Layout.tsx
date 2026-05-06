import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Compass, Search, Camera, MessageCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 w-full overflow-hidden">
      <div className="flex flex-col h-full w-full mx-auto bg-white shadow-xl relative">
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 safe-area-pb z-50">
          <div className="flex justify-around items-center h-16 w-full max-w-xl mx-auto">
            <NavLink 
              to="/app" 
              end
              className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Compass size={24} />
              <span className="text-[10px] font-medium">{t('nav.discover')}</span>
            </NavLink>
            
            <NavLink 
              to="/app/zoeken" 
              className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Search size={24} />
              <span className="text-[10px] font-medium">{t('nav.search')}</span>
            </NavLink>

            <div className="relative -top-5">
              <NavLink 
                to="/app/scan" 
                className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-full shadow-lg text-white hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95"
              >
                <Camera size={28} />
              </NavLink>
            </div>

            <NavLink 
              to="/app/berichten" 
              className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <MessageCircle size={24} />
              <span className="text-[10px] font-medium">{t('nav.messages')}</span>
            </NavLink>

            <NavLink 
              to="/app/profiel" 
              className={({isActive}) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <User size={24} />
              <span className="text-[10px] font-medium">{t('nav.profile')}</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  );
}
