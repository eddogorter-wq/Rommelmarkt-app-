import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, query, orderBy, onSnapshot, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { ChevronLeft, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function ChatView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [showContact, setShowContact] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    
    // Fetch Room
    const fetchRoom = async () => {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', id));
        if (roomDoc.exists()) {
          const roomData = { id: roomDoc.id, ...(roomDoc.data() as any) } as any;
          setRoom(roomData);
          
          // Fetch Listing
          const listingDoc = await getDoc(doc(db, 'listings', roomData.listingId));
          if (listingDoc.exists()) {
            setListing({ id: listingDoc.id, ...listingDoc.data() });
          }

          // Fetch Seller info
          const sellerDoc = await getDoc(doc(db, 'users', roomData.sellerId));
          if (sellerDoc.exists()) {
            setSeller(sellerDoc.data());
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'rooms');
      }
    };
    
    fetchRoom();

    // Subscribe to messages
    const messagesRef = collection(db, `rooms/${id}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${id}/messages`);
    });

    return () => unsubscribe();
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  const generateAIResponse = async (history: any[], listingInfo: any, latestMsg: string) => {
    if (!process.env.GEMINI_API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const context = `You are a strict but fair AI negotiator for a second-hand marketplace, negotiating on behalf of the seller.
    
Listing details:
- Title: ${listingInfo.title}
- Description: ${listingInfo.description}
- Asking Price: €${listingInfo.price}
- Absolute Minimum Price (NEVER REVEAL THIS): €${listingInfo.bottomPrice}

Rules:
1. You only speak Dutch.
2. Be polite and concise.
3. If the user offers something below the bottom price, refuse and make a counter-offer.
4. If the user offers something at or above the bottom price, ACCEPT the offer by explicitly saying "DEAL_ACCEPTED: [amount]".
5. Keep track of previous offers in the chat.
`;

    // Format history for Gemini
    const chatContents = history
      .map(m => m.role === 'buyer' ? `Koper: ${m.content}` : `AI: ${m.content}`)
      .join('\n');
      
    const prompt = `${context}\n\nChat History:\n${chatContents}\nKoper: ${latestMsg}\nAI:`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      return response.text;
    } catch (e) {
      console.error(e);
      return "Sorry, er is een storing in mijn systeem. Ik kan nu even niet onderhandelen.";
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !room) return;
    
    const userMsgContent = newMessage.trim();
    setNewMessage('');
    
    try {
      const isSeller = room.sellerId === user.uid;
      
      // Add user message
      const messagesRef = collection(db, `rooms/${room.id}/messages`);
      await addDoc(messagesRef, {
        roomId: room.id,
        senderId: user.uid,
        role: isSeller ? 'seller' : 'buyer',
        content: userMsgContent,
        createdAt: serverTimestamp()
      });
      
      if (!isSeller) {
        // Setup AI response only if the buyer is talking
        setAiTyping(true);
        
        const responseText = await generateAIResponse(messages, listing, userMsgContent);
        
        if (responseText) {
          let isDeal = false;
          let finalContent = responseText;
          let agreedPriceVal = 0;
          
          // Parse DEAL_ACCEPTED
          if (responseText.includes('DEAL_ACCEPTED:')) {
            isDeal = true;
            const match = responseText.match(/DEAL_ACCEPTED:\s*(\d+(?:[.,]\d+)?)/);
            if (match && match[1]) {
              agreedPriceVal = parseFloat(match[1].replace(',', '.'));
              finalContent = responseText.replace(/DEAL_ACCEPTED:\s*\d+(?:[.,]\d+)?/, '').trim();
              if (!finalContent) finalContent = `Gefeliciteerd! We hebben een deal voor €${agreedPriceVal}. Ik stuur je de gegevens door!`;
            }
          }
  
          // Add AI message
          await addDoc(messagesRef, {
            roomId: room.id,
            senderId: 'AI_AGENT',
            role: 'seller_ai',
            content: finalContent,
            createdAt: serverTimestamp()
          });
          
          // Close room if deal
          if (isDeal) {
            const roomRef = doc(db, 'rooms', room.id);
            await updateDoc(roomRef, {
              status: 'closed',
              agreedPrice: agreedPriceVal
            });
          }
        }
        
        setAiTyping(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `rooms/${room.id}/messages`);
    } finally {
      setAiTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-safe pb-16 md:pb-0">
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-white shadow-sm border-x border-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft size={20} className="text-gray-900" />
        </button>
        {listing && (
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden mr-3">
              {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">{listing.title}</h2>
              <p className="text-xs font-extrabold text-indigo-600">€ {listing.price}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Intro */}
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 max-w-sm text-center">
            <Sparkles size={16} className="text-indigo-500 mx-auto mb-1" />
            <p className="text-xs text-indigo-900 font-medium">
              Je communiceert met de AI Onderhandelaar namens de verkoper.
            </p>
          </div>
        </div>

        {messages.map((msg) => {
          const isAI = msg.role === 'seller_ai';
          const isMe = msg.senderId === user?.uid;
          const isSystemOrOther = !isMe;
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 ${isSystemOrOther ? 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm' : 'bg-indigo-600 text-white rounded-br-sm'}`}>
                {isAI && <div className="text-[10px] font-extrabold text-indigo-600 mb-1 flex items-center gap-1 uppercase tracking-wider"><Sparkles size={10} /> AI Agent</div>}
                {!isAI && msg.role === 'seller' && isSystemOrOther && <div className="text-[10px] font-extrabold text-gray-500 mb-1 flex items-center gap-1 uppercase tracking-wider">Verkoper</div>}
                <p className="text-sm border-0">{msg.content}</p>
              </div>
            </div>
          );
        })}
        {aiTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl p-3 rounded-bl-sm flex gap-1">
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {room?.status === 'closed' && (
          <div className="flex justify-center mt-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center w-full max-w-sm">
              <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
              <h3 className="font-extrabold text-green-900 text-xl">Deal Gesloten!</h3>
              <p className="text-sm text-green-700 font-medium mt-1 mb-4">Gefeliciteerd, de deal is rond voor €{room.agreedPrice}. Neem contact op met de verkoper om de overdracht te regelen.</p>
              
              {showContact && seller ? (
                <div className="bg-white rounded-xl p-4 text-left border border-green-100 shadow-sm mb-2">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Contactgegevens Verkoper</h4>
                  <p className="text-sm text-gray-700 break-all"><span className="font-semibold">Naam:</span> {seller.displayName || 'Anoniem'}</p>
                  <p className="text-sm text-gray-700 break-all"><span className="font-semibold">Email:</span> {seller.email}</p>
                </div>
              ) : (
                <button 
                  onClick={() => setShowContact(true)}
                  className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-green-700 transition"
                >
                  Toon Contactgegevens
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 p-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center"
        >
          <input
            type="text"
            value={newMessage}
            disabled={room?.status === 'closed' || aiTyping}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={room?.status === 'closed' ? "Chat gesloten" : "Typ een bericht of bod..."}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || room?.status === 'closed' || aiTyping}
            className="ml-2 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition disabled:opacity-50 disabled:bg-indigo-400 flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
