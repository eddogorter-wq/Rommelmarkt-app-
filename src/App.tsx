/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Discover from './pages/Discover';
import Search from './pages/Search';
import ScanUpload from './pages/ScanUpload';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Legal from './pages/Legal';
import ListingDetail from './pages/ListingDetail';
import ChatView from './pages/ChatView';
import Landing from './pages/Landing';
import Favorites from './pages/Favorites';
import SellerProfile from './pages/SellerProfile';
import { AuthProvider } from './lib/AuthContext';
import { messaging, onMessage } from './lib/firebase';

export default function App() {
  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        if (payload.notification) {
          // If we want a simple browser alert or native notification:
          if (Notification.permission === 'granted') {
            new Notification(payload.notification.title || 'Nieuwe melding', {
              body: payload.notification.body,
              icon: '/vite.svg'
            });
          } else {
            alert(`${payload.notification.title}\n${payload.notification.body}`);
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<Discover />} />
            <Route path="zoeken" element={<Search />} />
            <Route path="scan" element={<ScanUpload />} />
            <Route path="berichten" element={<Messages />} />
            <Route path="profiel" element={<Profile />} />
            <Route path="legal" element={<Legal />} />
          </Route>
          <Route path="/app/listing/:id" element={<ListingDetail />} />
          <Route path="/app/berichten/:id" element={<ChatView />} />
          <Route path="/app/profiel/favorieten" element={<Favorites />} />
          <Route path="/app/verkoper/:id" element={<SellerProfile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
