import React, { useState } from 'react';

const Navbar = () => {
  const [gameStatus, setGameStatus] = useState('playing');
  const [isMyTurn, setIsMyTurn] = useState(true);

  const statusText =
    gameStatus === 'playing'
      ? isMyTurn
        ? 'Your Turn'
        : "Opponent's Turn"
      : gameStatus.toUpperCase();

  return (
    <div className="w-full h-14 bg-[#1a1a1a] border-b border-gray-800 px-6 flex items-center justify-between">
      {/* Logo / Title */}
      <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
        CheckMate
      </h1>

      {/* Game Status + Settings */}
      <div className="flex items-center gap-3">
        {/* Game Status */}

        {/* Settings Button */}
        <button
          className="px-3 py-1.5 bg-white hover:bg-stone-100 rounded-lg text-sm transition-all flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Settings"
          title="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
};

export default Navbar;
