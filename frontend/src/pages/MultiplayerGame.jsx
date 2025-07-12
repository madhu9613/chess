// src/pages/MultiplayerGamePage.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import PlayerCard from '../components/PlayerCard.jsx';
import GameControls from '../components/GameControls.jsx';
import GameChat from '../components/GameChat.jsx';

const MultiplayerGame = () => {
  const { appstate } = useContext(AppContext);
  const [gameStatus, setGameStatus] = useState('playing');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(true);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-stone-100 p-3 md:p-6">

      {/* Mobile header with toggle button */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-amber-400">Chess Match</h1>
        <button 
          onClick={() => setShowSidePanel(!showSidePanel)}
          className="bg-stone-700 hover:bg-stone-600 p-2 rounded-lg"
        >
          {showSidePanel ? 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg> : 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          }
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Board and Players */}
        <div className="md:col-span-3 lg:col-span-2 flex flex-col gap-4 md:gap-6">
          {/* Players and Board Container */}
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Opponent Player Card (Top - Hidden on mobile when side panel is visible) */}
            <div className={`md:block ${showSidePanel ? 'hidden md:block' : ''}`}>
              <PlayerCard 
                name="Alex Johnson" 
                rating={1850} 
                color="black" 
                isActive={!isMyTurn} 
                timeLeft="12:45" 
                isOpponent={true}
              />
            </div>
            
            {/* Chess Board */}
            <div className="w-full max-w-[600px] mx-auto">
              <Board />
            </div>
            
            {/* User Player Card and Controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className={`md:block ${showSidePanel ? 'hidden md:block' : ''}`}>
                <PlayerCard 
                  name="You" 
                  rating={1920} 
                  color="white" 
                  isActive={isMyTurn} 
                  timeLeft="15:30"
                />
              </div>
              <GameControls className="flex-grow"/>
            </div>
          </div>
        </div>
        
        {/* Right Column - Game Info (Hidden on mobile when toggled off) */}
        <div className={`flex flex-col gap-4 md:gap-6 ${showSidePanel ? 'block' : 'hidden md:block'}`}>
          {/* Move List */}
          <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 border border-white/10">
            <h3 className="text-lg font-bold text-amber-300 mb-3">Move History</h3>
            <MoveList />
          </div>
          
          {/* Game Chat */}
          <GameChat/>

        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;