// src/pages/MultiplayerGamePage.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import PlayerCard from '../components/PlayerCard.jsx';

const MultiplayerGame = () => {
  const { appstate } = useContext(AppContext);
  const [gameStatus, setGameStatus] = useState('playing');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'opponent', name: 'Alex (1850)', text: 'Hi there! Good luck!', time: '10:30' },
    { id: 2, user: 'me', name: 'You (1920)', text: 'Thanks, you too!', time: '10:31' },
    { id: 3, user: 'opponent', name: 'Alex (1850)', text: 'Interesting opening choice...', time: '10:33' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: chatMessages.length + 1,
        user: 'me',
        name: 'You (1920)',
        text: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-stone-100 p-4 md:p-6">
      {/* Game Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            Chess Royale
          </h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              gameStatus === 'playing' 
                ? 'bg-green-500/20 text-green-400' 
                : gameStatus === 'checkmate' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-amber-500/20 text-amber-400'
            }`}>
              {gameStatus === 'playing' 
                ? (isMyTurn ? 'YOUR TURN' : 'OPPONENT\'S TURN') 
                : gameStatus.toUpperCase()}
            </div>
            <button className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm transition-all flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Player and Board */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Player Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlayerCard 
              name="Alex Johnson" 
              rating={1850} 
              color="black" 
              isActive={!isMyTurn} 
              timeLeft="12:45" 
              isOpponent={true}
            />
            <PlayerCard 
              name="You" 
              rating={1920} 
              color="white" 
              isActive={isMyTurn} 
              timeLeft="15:30"
            />
          </div>
          
          {/* Chess Board */}
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
            <Board />
          </div>
        </div>
        
        {/* Right Column - Game Info */}
        <div className="flex flex-col gap-6">
          {/* Move List */}
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
            <MoveList />
          </div>
          
          {/* Game Controls */}
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
            <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Game Controls
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-stone-700 hover:bg-stone-600 p-3 rounded-xl flex flex-col items-center justify-center transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs">Offer Draw</span>
              </button>
              <button className="bg-amber-600/50 hover:bg-amber-600 p-3 rounded-xl flex flex-col items-center justify-center transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs">Add Time</span>
              </button>
              <button className="bg-stone-700 hover:bg-stone-600 p-3 rounded-xl flex flex-col items-center justify-center transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-xs">Resign</span>
              </button>
              <button className="bg-stone-700 hover:bg-stone-600 p-3 rounded-xl flex flex-col items-center justify-center transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-xs">Rematch</span>
              </button>
            </div>
          </div>
          
          {/* Enhanced Game Chat */}
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10 flex flex-col h-[320px]">
            <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
              Game Chat
            </h3>
            
            <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-stone-700 rounded-lg mb-3 space-y-2">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex items-start gap-2 ${message.user === 'me' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                      message.user === 'me' 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700' 
                        : 'bg-stone-700'
                    }`}>
                      <span className="text-xs font-bold">
                        {message.user === 'me' ? 'Y' : 'A'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col max-w-[calc(100%-3rem)]">
                      <div className="text-xs font-semibold text-stone-400 mb-0.5">
                        {message.name} • {message.time}
                      </div>
                      <div
                        className={`rounded-xl p-3 ${
                          message.user === 'me'
                            ? 'bg-gradient-to-r from-amber-600/80 to-amber-700/80 rounded-br-none'
                            : 'bg-stone-700 rounded-bl-none'
                        }`}
                      >
                        <div className="text-sm">{message.text}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;