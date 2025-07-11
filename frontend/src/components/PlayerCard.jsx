// src/components/PlayerCard.jsx
import React from 'react';

const PlayerCard = ({ name, rating, color, isActive, timeLeft, isOpponent = false }) => {
  return (
    <div className={`bg-stone-800/50 backdrop-blur-sm rounded-2xl p-4 border ${
      isActive 
        ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
        : 'border-white/10'
    } transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            color === 'white' 
              ? 'bg-gradient-to-br from-amber-100 to-stone-300 text-stone-800' 
              : 'bg-gradient-to-br from-stone-800 to-black text-amber-300'
          }`}>
            {color === 'white' ? '♔' : '♚'}
          </div>
          <div>
            <div className="font-bold">{name}</div>
            <div className="text-xs text-stone-400">{rating} ELO</div>
          </div>
        </div>
        
        {isOpponent ? (
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-stone-700/50 hover:bg-stone-600 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-1.5 bg-stone-700/50 hover:bg-stone-600 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className={`text-lg font-mono px-3 py-1 rounded-lg ${
            isActive ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-700 text-stone-400'
          }`}>
            {timeLeft}
          </div>
        )}
      </div>
      
      {isOpponent && (
        <div className="mt-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-1 text-stone-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{timeLeft}</span>
          </div>
          <div className="text-xs bg-stone-700/50 px-2 py-1 rounded">
            Online
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;