// src/pages/MultiplayerGamePage.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import PlayerCard from '../components/PlayerCard.jsx';
import GameControls from '../components/GameControls.jsx';

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

      <div className="max-w-7xl mx-auto grid grid-cols-4  lg:grid-cols-3 gap-6">
        {/* Left Column - Player and Board */}
       
        <div className="lg:col-span-2 flex flex-col gap-6">
        
          {/* Chess Board */}
          {/* <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10"> */}
              <PlayerCard 
              name="Alex Johnson" 
              rating={1850} 
              color="black" 
              isActive={!isMyTurn} 
              timeLeft="12:45" 
              isOpponent={true}
              className='w-[100px]'
            />
            <Board />
            <div className='flex items-center justify-start gap-3'>
             <PlayerCard 
              name="You" 
              rating={1920} 
              color="white" 
              isActive={isMyTurn} 
              timeLeft="15:30"
            />
            <GameControls/>
          
            </div>
           
          {/* </div> */}
        </div>
        
        {/* Right Column - Game Info */}
        <div className="flex flex-col gap-6">
          {/* Move List */}
          
         
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
            <MoveList />
          </div>
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